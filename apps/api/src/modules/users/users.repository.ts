import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string, db: DbClient = this.prisma): Promise<User | null> {
    return db.user.findUnique({ where: { email } });
  }

  findById(id: string, db: DbClient = this.prisma): Promise<User | null> {
    return db.user.findUnique({ where: { id } });
  }

  create(
    data: { email: string; name: string; passwordHash: string },
    db: DbClient = this.prisma,
  ): Promise<User> {
    return db.user.create({ data });
  }

  updateName(id: string, name: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { name },
    });
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}
