import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class InvestmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByGroup(groupId: string) {
    return this.prisma.investment.findMany({
      where: { groupId },
      orderBy: { investedAt: 'desc' },
    });
  }

  sumAmount(groupId: string) {
    return this.prisma.investment.aggregate({
      where: { groupId },
      _sum: { amount: true },
    });
  }

  create(data: {
    groupId: string;
    name: string;
    ticker: string | null;
    amount: Prisma.Decimal;
    quantity: Prisma.Decimal | null;
    investedAt: Date;
  }) {
    return this.prisma.investment.create({ data });
  }

  findInGroup(id: string, groupId: string) {
    return this.prisma.investment.findFirst({ where: { id, groupId } });
  }

  update(
    id: string,
    data: {
      name: string;
      ticker: string | null;
      amount: Prisma.Decimal;
      quantity: Prisma.Decimal | null;
      investedAt: Date;
    },
  ) {
    return this.prisma.investment.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.investment.delete({ where: { id } });
  }
}
