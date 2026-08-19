import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BudgetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listExpenseCategories(groupId: string) {
    return this.prisma.category.findMany({
      where: { groupId, type: 'EXPENSE' },
      orderBy: { name: 'asc' },
    });
  }

  listByMonth(groupId: string, month: string) {
    return this.prisma.categoryBudget.findMany({
      where: { groupId, month },
      include: { category: true },
    });
  }

  spentByCategory(groupId: string, range: { gte: Date; lt: Date }) {
    return this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        groupId,
        type: 'EXPENSE',
        occurredAt: { gte: range.gte, lt: range.lt },
        categoryId: { not: null },
      },
      _sum: { amount: true },
    });
  }

  upsert(data: {
    groupId: string;
    categoryId: string;
    month: string;
    amount: Prisma.Decimal;
  }) {
    return this.prisma.categoryBudget.upsert({
      where: {
        groupId_categoryId_month: {
          groupId: data.groupId,
          categoryId: data.categoryId,
          month: data.month,
        },
      },
      create: data,
      update: { amount: data.amount },
    });
  }

  delete(groupId: string, categoryId: string, month: string) {
    return this.prisma.categoryBudget.deleteMany({
      where: { groupId, categoryId, month },
    });
  }

  copyMonth(groupId: string, fromMonth: string, toMonth: string) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.categoryBudget.findMany({
        where: { groupId, month: fromMonth },
      });
      await tx.categoryBudget.deleteMany({
        where: { groupId, month: toMonth },
      });
      if (source.length === 0) {
        return [];
      }
      await tx.categoryBudget.createMany({
        data: source.map((row) => ({
          groupId,
          categoryId: row.categoryId,
          month: toMonth,
          amount: row.amount,
        })),
      });
      return tx.categoryBudget.findMany({
        where: { groupId, month: toMonth },
        include: { category: true },
      });
    });
  }
}
