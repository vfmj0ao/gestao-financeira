import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MembershipAccessService } from '../../common/auth/membership-access.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { formatMoney, monthRange, parseMoney } from '../transactions/money';
import type { CopyBudgetsInput, UpsertBudgetsInput } from './budgets.schemas';
import { BudgetsRepository } from './budgets.repository';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly membershipAccess: MembershipAccessService,
  ) {}

  async list(user: AuthenticatedUser, groupId: string, month: string) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_READ',
    );
    return this.buildMonth(groupId, month);
  }

  async upsert(
    user: AuthenticatedUser,
    groupId: string,
    input: UpsertBudgetsInput,
  ) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_CREATE',
    );
    const categories =
      await this.budgetsRepository.listExpenseCategories(groupId);
    const allowed = new Set(categories.map((category) => category.id));

    for (const item of input.items) {
      if (!allowed.has(item.categoryId)) {
        throw new BadRequestException('Categoria inválida para orçamento');
      }
      if (item.amount === null) {
        await this.budgetsRepository.delete(
          groupId,
          item.categoryId,
          input.month,
        );
        continue;
      }
      let amount: Prisma.Decimal;
      try {
        amount = parseMoney(item.amount);
      } catch {
        throw new BadRequestException(
          'Informe um valor maior que zero, com até 2 casas decimais',
        );
      }
      await this.budgetsRepository.upsert({
        groupId,
        categoryId: item.categoryId,
        month: input.month,
        amount,
      });
    }

    return this.buildMonth(groupId, input.month);
  }

  async copy(
    user: AuthenticatedUser,
    groupId: string,
    input: CopyBudgetsInput,
  ) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_CREATE',
    );
    if (input.fromMonth === input.toMonth) {
      throw new BadRequestException('Escolha um mês de destino diferente');
    }
    await this.budgetsRepository.copyMonth(
      groupId,
      input.fromMonth,
      input.toMonth,
    );
    return this.buildMonth(groupId, input.toMonth);
  }

  private async buildMonth(groupId: string, month: string) {
    const [categories, budgets, spentRows] = await Promise.all([
      this.budgetsRepository.listExpenseCategories(groupId),
      this.budgetsRepository.listByMonth(groupId, month),
      this.budgetsRepository.spentByCategory(groupId, monthRange(month)),
    ]);
    const budgetByCategory = new Map(
      budgets.map((row) => [row.categoryId, row.amount]),
    );
    const spentByCategory = new Map(
      spentRows.map((row) => [
        row.categoryId ?? '',
        row._sum.amount ?? new Prisma.Decimal(0),
      ]),
    );

    const items = categories.map((category) => {
      const limit = budgetByCategory.get(category.id) ?? null;
      const spent = spentByCategory.get(category.id) ?? new Prisma.Decimal(0);
      const remaining = limit ? limit.minus(spent) : null;
      return {
        categoryId: category.id,
        name: category.name,
        limit: limit ? formatMoney(limit) : null,
        spent: formatMoney(spent),
        remaining: remaining ? formatMoney(remaining) : null,
        over: limit ? spent.gt(limit) : false,
      };
    });

    return { month, items };
  }
}
