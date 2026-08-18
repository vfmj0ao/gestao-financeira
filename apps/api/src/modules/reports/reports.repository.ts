import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listTransactionsInRange(groupId: string, range: { gte: Date; lt: Date }) {
    return this.prisma.transaction.findMany({
      where: {
        groupId,
        occurredAt: { gte: range.gte, lt: range.lt },
      },
      select: {
        type: true,
        amount: true,
        occurredAt: true,
        category: { select: { name: true } },
      },
    });
  }

  sumInvestments(groupId: string) {
    return this.prisma.investment.aggregate({
      where: { groupId },
      _sum: { amount: true },
    });
  }
}
