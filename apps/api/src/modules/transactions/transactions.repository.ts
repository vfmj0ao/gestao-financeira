import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DEFAULT_CATEGORIES } from './default-categories';

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listCategories(groupId: string) {
    return this.prisma.category.findMany({
      where: { groupId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  seedDefaultCategories(groupId: string) {
    return this.prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({ ...category, groupId })),
    });
  }

  findCategoryInGroup(
    categoryId: string,
    groupId: string,
    type: TransactionType,
  ) {
    return this.prisma.category.findFirst({
      where: { id: categoryId, groupId, type },
    });
  }

  listByGroupMonth(groupId: string, range: { gte: Date; lt: Date }) {
    return this.prisma.transaction.findMany({
      where: {
        groupId,
        occurredAt: { gte: range.gte, lt: range.lt },
      },
      include: { category: true },
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  sumByType(groupId: string, range: { gte: Date; lt: Date }) {
    return this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        groupId,
        occurredAt: { gte: range.gte, lt: range.lt },
      },
      _sum: { amount: true },
    });
  }

  create(data: {
    groupId: string;
    categoryId: string;
    type: TransactionType;
    amount: Prisma.Decimal;
    description: string;
    occurredAt: Date;
  }) {
    return this.prisma.transaction.create({
      data,
      include: { category: true },
    });
  }

  findInGroup(id: string, groupId: string) {
    return this.prisma.transaction.findFirst({
      where: { id, groupId },
    });
  }

  delete(id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }
}
