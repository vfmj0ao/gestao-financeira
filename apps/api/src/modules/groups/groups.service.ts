import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type Prisma } from '@prisma/client';
import { generateUrlToken, hashToken } from '../../common/auth/token';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import type { InviteMemberInput } from '../auth/auth.schemas';
import { GroupsRepository } from './groups.repository';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly prisma: PrismaService,
  ) {}

  createOwnedGroup(
    name: string,
    ownerId: string,
    db?: Prisma.TransactionClient,
  ) {
    return this.groupsRepository.createOwnedGroup(name, ownerId, db);
  }

  async listMine(userId: string) {
    const memberships = await this.groupsRepository.listByUser(userId);
    return memberships.map((membership) => ({
      id: membership.group.id,
      name: membership.group.name,
      role: membership.role,
      permissions: membership.permissions.map((item) => item.permission),
    }));
  }

  async listMembers(user: AuthenticatedUser, groupId: string) {
    const membership = await this.groupsRepository.findMembership(
      user.id,
      groupId,
    );
    if (!membership) {
      throw new ForbiddenException('Você não faz parte deste grupo');
    }
    const members = await this.groupsRepository.listMembers(groupId);
    return members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
      permissions: member.permissions.map((item) => item.permission),
    }));
  }

  async createInvite(
    user: AuthenticatedUser,
    groupId: string,
    input: InviteMemberInput,
  ) {
    await this.requirePermission(user.id, groupId, 'MEMBERS_INVITE');

    const pending = await this.groupsRepository.findPendingInvite(
      groupId,
      input.email,
    );
    if (pending && pending.expiresAt > new Date()) {
      throw new ConflictException(
        'Já existe um convite pendente para este e-mail',
      );
    }

    const members = await this.groupsRepository.listMembers(groupId);
    if (members.some((member) => member.user.email === input.email)) {
      throw new ConflictException('Esta pessoa já faz parte do grupo');
    }

    const token = generateUrlToken();
    await this.groupsRepository.createInvitation({
      email: input.email,
      groupId,
      role: input.role,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      invitedById: user.id,
    });

    const appOrigin = process.env.APP_ORIGIN ?? 'http://localhost:3000';
    return {
      email: input.email,
      role: input.role,
      inviteUrl: `${appOrigin}/convite?token=${token}`,
    };
  }

  async getInvitePreview(token: string) {
    const invitation = await this.groupsRepository.findInvitationByTokenHash(
      hashToken(token),
    );
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt <= new Date()
    ) {
      throw new NotFoundException('Convite inválido ou expirado');
    }

    return {
      email: invitation.email,
      groupName: invitation.group.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  async acceptInvite(
    user: AuthenticatedUser,
    token: string,
    db?: Prisma.TransactionClient,
  ) {
    const run = async (tx: Prisma.TransactionClient | PrismaService) => {
      const invitation = await this.groupsRepository.findInvitationByTokenHash(
        hashToken(token),
        tx,
      );
      if (
        !invitation ||
        invitation.acceptedAt ||
        invitation.expiresAt <= new Date()
      ) {
        throw new BadRequestException('Convite inválido ou expirado');
      }
      if (invitation.email !== user.email) {
        throw new ForbiddenException(
          'Este convite foi enviado para outro e-mail',
        );
      }

      const existing = await this.groupsRepository.findMembership(
        user.id,
        invitation.groupId,
        tx,
      );
      if (existing) {
        throw new ConflictException('Você já faz parte deste grupo');
      }

      await this.groupsRepository.markInvitationAccepted(invitation.id, tx);
      await this.groupsRepository.addMemberWithRole(
        invitation.groupId,
        user.id,
        invitation.role,
        tx,
      );

      return {
        id: invitation.group.id,
        name: invitation.group.name,
        role: invitation.role,
      };
    };

    if (db) {
      return run(db);
    }
    return this.prisma.$transaction((tx) => run(tx));
  }

  private async requirePermission(
    userId: string,
    groupId: string,
    permission:
      | 'MEMBERS_INVITE'
      | 'GROUP_MANAGE'
      | 'MEMBERS_REMOVE'
      | 'MEMBERS_UPDATE_ROLE',
  ) {
    const membership = await this.groupsRepository.findMembership(
      userId,
      groupId,
    );
    if (!membership) {
      throw new ForbiddenException('Você não faz parte deste grupo');
    }
    const allowed = membership.permissions.some(
      (item) => item.permission === permission,
    );
    if (!allowed) {
      throw new ForbiddenException('Você não tem permissão para esta ação');
    }
    return membership;
  }
}

export function familyGroupName(fullName: string): string {
  const firstName = fullName.trim().split(/\s+/)[0] ?? 'Família';
  return `Família de ${firstName}`;
}
