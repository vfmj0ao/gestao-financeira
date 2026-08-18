import { Injectable } from '@nestjs/common';
import type { MembershipRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ROLE_PERMISSIONS } from '../../common/auth/role-permissions';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOwnedGroup(
    name: string,
    ownerId: string,
    db: DbClient = this.prisma,
  ) {
    const group = await db.group.create({
      data: { name, ownerId },
    });

    const membership = await db.membership.create({
      data: {
        userId: ownerId,
        groupId: group.id,
        role: 'OWNER',
      },
    });

    await db.membershipPermission.createMany({
      data: ROLE_PERMISSIONS.OWNER.map((permission) => ({
        membershipId: membership.id,
        permission,
      })),
    });

    await db.category.createMany({
      data: [
        { groupId: group.id, name: 'Salário', type: 'INCOME' },
        { groupId: group.id, name: 'Freelance', type: 'INCOME' },
        { groupId: group.id, name: 'Rendimentos', type: 'INCOME' },
        { groupId: group.id, name: 'Outros', type: 'INCOME' },
        { groupId: group.id, name: 'Moradia', type: 'EXPENSE' },
        { groupId: group.id, name: 'Alimentação', type: 'EXPENSE' },
        { groupId: group.id, name: 'Transporte', type: 'EXPENSE' },
        { groupId: group.id, name: 'Saúde', type: 'EXPENSE' },
        { groupId: group.id, name: 'Educação', type: 'EXPENSE' },
        { groupId: group.id, name: 'Lazer', type: 'EXPENSE' },
        { groupId: group.id, name: 'Contas', type: 'EXPENSE' },
        { groupId: group.id, name: 'Outros', type: 'EXPENSE' },
      ],
    });

    return group;
  }

  findMembership(userId: string, groupId: string, db: DbClient = this.prisma) {
    return db.membership.findUnique({
      where: { userId_groupId: { userId, groupId } },
      include: { permissions: true, group: true },
    });
  }

  listByUser(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      include: {
        group: true,
        permissions: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  listMembers(groupId: string) {
    return this.prisma.membership.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        permissions: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findPendingInvite(
    groupId: string,
    email: string,
    db: DbClient = this.prisma,
  ) {
    return db.invitation.findFirst({
      where: { groupId, email, acceptedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  createInvitation(
    data: {
      email: string;
      groupId: string;
      role: MembershipRole;
      tokenHash: string;
      expiresAt: Date;
      invitedById: string;
    },
    db: DbClient = this.prisma,
  ) {
    return db.invitation.create({ data });
  }

  findInvitationByTokenHash(tokenHash: string, db: DbClient = this.prisma) {
    return db.invitation.findUnique({
      where: { tokenHash },
      include: { group: true },
    });
  }

  async addMemberWithRole(
    groupId: string,
    userId: string,
    role: MembershipRole,
    db: DbClient = this.prisma,
  ) {
    const membership = await db.membership.create({
      data: { groupId, userId, role },
    });
    await db.membershipPermission.createMany({
      data: ROLE_PERMISSIONS[role].map((permission) => ({
        membershipId: membership.id,
        permission,
      })),
    });
    return membership;
  }

  markInvitationAccepted(invitationId: string, db: DbClient = this.prisma) {
    return db.invitation.update({
      where: { id: invitationId },
      data: { acceptedAt: new Date() },
    });
  }
}
