import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import type { User } from '@prisma/client';
import type { Response, Request } from 'express';
import { Prisma } from '@prisma/client';
import { generateUrlToken, hashToken } from '../../common/auth/token';
import { PrismaService } from '../../common/prisma/prisma.service';
import { familyGroupName, GroupsService } from '../groups/groups.service';
import { UsersRepository } from '../users/users.repository';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { RefreshTokenRepository } from './refresh-token.repository';

const REFRESH_COOKIE = 'gf_refresh';
const DUMMY_PASSWORD = 'invalid-credentials-placeholder';

@Injectable()
export class AuthService {
  private dummyHashPromise: Promise<string> | null = null;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly groupsService: GroupsService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterInput, response: Response) {
    const existing = await this.usersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado');
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await this.usersRepository.create(
          {
            email: input.email,
            name: input.name,
            passwordHash,
          },
          tx,
        );

        if (input.inviteToken) {
          await this.groupsService.acceptInvite(
            { id: created.id, email: created.email },
            input.inviteToken,
            tx,
          );
        } else {
          await this.groupsService.createOwnedGroup(
            familyGroupName(created.name),
            created.id,
            tx,
          );
        }

        return created;
      });

      return this.createSession(user, response);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este e-mail já está cadastrado');
      }
      throw error;
    }
  }

  async login(input: LoginInput, response: Response) {
    const user = await this.usersRepository.findByEmail(input.email);
    const hash = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await argon2.verify(hash, input.password);

    if (!user || !valid) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.createSession(user, response);
  }

  async refresh(request: Request, response: Response) {
    const rawToken = readRefreshCookie(request);
    if (!rawToken) {
      throw new UnauthorizedException('Sessão inválida');
    }

    const stored = await this.refreshTokenRepository.findActiveByHash(
      hashToken(rawToken),
    );
    if (!stored) {
      throw new UnauthorizedException('Sessão inválida');
    }

    if (stored.revokedAt) {
      await this.refreshTokenRepository.revokeAllForUser(stored.userId);
      this.clearRefreshCookie(response);
      throw new UnauthorizedException('Sessão inválida');
    }

    if (stored.expiresAt <= new Date()) {
      await this.refreshTokenRepository.revoke(stored.id);
      this.clearRefreshCookie(response);
      throw new UnauthorizedException('Sessão expirada');
    }

    const user = await this.usersRepository.findById(stored.userId);
    if (!user) {
      this.clearRefreshCookie(response);
      throw new UnauthorizedException('Sessão inválida');
    }

    await this.refreshTokenRepository.revoke(stored.id);
    return this.createSession(user, response);
  }

  async logout(request: Request, response: Response) {
    const rawToken = readRefreshCookie(request);
    if (rawToken) {
      const stored = await this.refreshTokenRepository.findActiveByHash(
        hashToken(rawToken),
      );
      if (stored && !stored.revokedAt) {
        await this.refreshTokenRepository.revoke(stored.id);
      }
    }
    this.clearRefreshCookie(response);
    return { ok: true as const };
  }

  async me(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Sessão inválida');
    }
    return this.toPublicUser(user);
  }

  private async createSession(user: User, response: Response) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const refreshToken = generateUrlToken();
    const refreshDays = 7;
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
    });

    this.setRefreshCookie(response, refreshToken, refreshDays);
    return {
      accessToken,
      user: await this.toPublicUser(user),
    };
  }

  private async toPublicUser(user: User) {
    const groups = await this.groupsService.listMine(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      groups,
    };
  }

  private setRefreshCookie(response: Response, token: string, days: number) {
    response.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: days * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(response: Response) {
    response.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });
  }

  private getDummyHash(): Promise<string> {
    this.dummyHashPromise ??= argon2.hash(DUMMY_PASSWORD, {
      type: argon2.argon2id,
    });
    return this.dummyHashPromise;
  }
}

function readRefreshCookie(request: Request): string | null {
  const cookies = request.cookies as
    Record<string, string | undefined> | undefined;
  const value = cookies?.[REFRESH_COOKIE];
  if (typeof value !== 'string' || value.length < 20) {
    return null;
  }
  return value;
}
