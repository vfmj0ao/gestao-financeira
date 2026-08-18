import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type GroupPermission =
  | 'GROUP_MANAGE'
  | 'MEMBERS_INVITE'
  | 'MEMBERS_REMOVE'
  | 'MEMBERS_UPDATE_ROLE'
  | 'TRANSACTIONS_READ'
  | 'TRANSACTIONS_CREATE'
  | 'TRANSACTIONS_UPDATE'
  | 'TRANSACTIONS_DELETE'
  | 'INVESTMENTS_READ'
  | 'INVESTMENTS_CREATE'
  | 'INVESTMENTS_UPDATE'
  | 'INVESTMENTS_DELETE'
  | 'CATEGORIES_MANAGE';

@Injectable()
export class MembershipAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requirePermission(
    userId: string,
    groupId: string,
    permission: GroupPermission,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_groupId: { userId, groupId } },
      include: { permissions: true },
    });

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
