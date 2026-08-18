import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MembershipAccessService } from '../../common/auth/membership-access.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { formatMoney, trailingMonths } from '../transactions/money';
import { ReportsRepository } from './reports.repository';

const ZERO = new Prisma.Decimal(0);

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly membershipAccess: MembershipAccessService,
  ) {}

  async getReport(
    user: AuthenticatedUser,
    groupId: string,
    monthsCount: 6 | 12 | 24,
  ) {
    const membership = await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_READ',
    );
    const canReadInvestments = membership.permissions.some(
      (item) => item.permission === 'INVESTMENTS_READ',
    );

    const { months, gte, lt } = trailingMonths(monthsCount);
    const [transactions, investments] = await Promise.all([
      this.reportsRepository.listTransactionsInRange(groupId, { gte, lt }),
      canReadInvestments
        ? this.reportsRepository.sumInvestments(groupId)
        : Promise.resolve(null),
    ]);

    const byMonth = new Map(
      months.map((month) => [month, { income: ZERO, expense: ZERO }]),
    );
    const expenseByCategory = new Map<string, Prisma.Decimal>();
    const incomeByCategory = new Map<string, Prisma.Decimal>();

    for (const transaction of transactions) {
      const month = transaction.occurredAt.toISOString().slice(0, 7);
      const bucket = byMonth.get(month);
      if (!bucket) {
        continue;
      }
      const categoryName = transaction.category?.name ?? 'Sem categoria';
      if (transaction.type === 'INCOME') {
        bucket.income = bucket.income.plus(transaction.amount);
        incomeByCategory.set(
          categoryName,
          (incomeByCategory.get(categoryName) ?? ZERO).plus(transaction.amount),
        );
      } else {
        bucket.expense = bucket.expense.plus(transaction.amount);
        expenseByCategory.set(
          categoryName,
          (expenseByCategory.get(categoryName) ?? ZERO).plus(
            transaction.amount,
          ),
        );
      }
    }

    let accumulated = ZERO;
    let periodIncome = ZERO;
    let periodExpense = ZERO;
    const monthRows = months.map((month) => {
      const totals = byMonth.get(month) ?? { income: ZERO, expense: ZERO };
      const balance = totals.income.minus(totals.expense);
      accumulated = accumulated.plus(balance);
      periodIncome = periodIncome.plus(totals.income);
      periodExpense = periodExpense.plus(totals.expense);
      return {
        month,
        income: formatMoney(totals.income),
        expense: formatMoney(totals.expense),
        balance: formatMoney(balance),
        accumulated: formatMoney(accumulated),
      };
    });

    return {
      from: months[0],
      to: months[months.length - 1],
      months: monthRows,
      totals: {
        income: formatMoney(periodIncome),
        expense: formatMoney(periodExpense),
        balance: formatMoney(periodIncome.minus(periodExpense)),
      },
      expenseByCategory: toSortedCategoryRows(expenseByCategory),
      incomeByCategory: toSortedCategoryRows(incomeByCategory),
      investmentsTotal: investments
        ? formatMoney(investments._sum.amount ?? ZERO)
        : null,
    };
  }
}

function toSortedCategoryRows(totals: Map<string, Prisma.Decimal>) {
  return [...totals.entries()]
    .sort((left, right) => right[1].comparedTo(left[1]))
    .map(([name, amount]) => ({ name, amount: formatMoney(amount) }));
}
