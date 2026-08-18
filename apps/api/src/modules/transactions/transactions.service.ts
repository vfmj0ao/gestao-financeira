import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MembershipAccessService } from '../../common/auth/membership-access.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { dateFromDay, formatMoney, monthRange, parseMoney } from './money';
import type {
  CreateCategoryInput,
  CreateTransactionInput,
} from './transactions.schemas';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly membershipAccess: MembershipAccessService,
  ) {}

  async listCategories(user: AuthenticatedUser, groupId: string) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_READ',
    );
    let categories = await this.transactionsRepository.listCategories(groupId);
    if (categories.length === 0) {
      await this.transactionsRepository.seedDefaultCategories(groupId);
      categories = await this.transactionsRepository.listCategories(groupId);
    }
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    }));
  }

  async list(user: AuthenticatedUser, groupId: string, month: string) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_READ',
    );
    const items = await this.transactionsRepository.listByGroupMonth(
      groupId,
      monthRange(month),
    );
    return items.map((item) => this.toPublic(item));
  }

  async summary(user: AuthenticatedUser, groupId: string, month: string) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_READ',
    );
    const totals = await this.transactionsRepository.sumByType(
      groupId,
      monthRange(month),
    );
    const income =
      totals.find((item) => item.type === 'INCOME')?._sum.amount ??
      new Prisma.Decimal(0);
    const expense =
      totals.find((item) => item.type === 'EXPENSE')?._sum.amount ??
      new Prisma.Decimal(0);

    return {
      month,
      income: formatMoney(income),
      expense: formatMoney(expense),
      balance: formatMoney(income.minus(expense)),
    };
  }

  async create(
    user: AuthenticatedUser,
    groupId: string,
    input: CreateTransactionInput,
  ) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_CREATE',
    );

    const category = await this.transactionsRepository.findCategoryInGroup(
      input.categoryId,
      groupId,
      input.type,
    );
    if (!category) {
      throw new BadRequestException(
        'Categoria inválida para este tipo de lançamento',
      );
    }

    let amount: Prisma.Decimal;
    try {
      amount = parseMoney(input.amount);
    } catch {
      throw new BadRequestException(
        'Informe um valor maior que zero, com até 2 casas decimais',
      );
    }

    const created = await this.transactionsRepository.create({
      groupId,
      categoryId: category.id,
      type: input.type,
      amount,
      description: input.description,
      occurredAt: dateFromDay(input.occurredOn),
    });

    return this.toPublic(created);
  }

  async update(
    user: AuthenticatedUser,
    groupId: string,
    transactionId: string,
    input: CreateTransactionInput,
  ) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_UPDATE',
    );
    const existing = await this.transactionsRepository.findInGroup(
      transactionId,
      groupId,
    );
    if (!existing) {
      throw new NotFoundException('Lançamento não encontrado');
    }

    const category = await this.transactionsRepository.findCategoryInGroup(
      input.categoryId,
      groupId,
      input.type,
    );
    if (!category) {
      throw new BadRequestException(
        'Categoria inválida para este tipo de lançamento',
      );
    }

    let amount: Prisma.Decimal;
    try {
      amount = parseMoney(input.amount);
    } catch {
      throw new BadRequestException(
        'Informe um valor maior que zero, com até 2 casas decimais',
      );
    }

    const updated = await this.transactionsRepository.update(existing.id, {
      categoryId: category.id,
      type: input.type,
      amount,
      description: input.description,
      occurredAt: dateFromDay(input.occurredOn),
    });
    return this.toPublic(updated);
  }

  async createCategory(
    user: AuthenticatedUser,
    groupId: string,
    input: CreateCategoryInput,
  ) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'CATEGORIES_MANAGE',
    );
    try {
      const category = await this.transactionsRepository.createCategory(
        groupId,
        input.name,
        input.type,
      );
      return { id: category.id, name: category.name, type: category.type };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Já existe uma categoria com esse nome');
      }
      throw error;
    }
  }

  async remove(
    user: AuthenticatedUser,
    groupId: string,
    transactionId: string,
  ) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'TRANSACTIONS_DELETE',
    );
    const existing = await this.transactionsRepository.findInGroup(
      transactionId,
      groupId,
    );
    if (!existing) {
      throw new NotFoundException('Lançamento não encontrado');
    }
    await this.transactionsRepository.delete(existing.id);
    return { ok: true as const };
  }

  private toPublic(item: {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: Prisma.Decimal;
    description: string;
    occurredAt: Date;
    category: { id: string; name: string } | null;
  }) {
    return {
      id: item.id,
      type: item.type,
      amount: formatMoney(item.amount),
      description: item.description,
      occurredOn: item.occurredAt.toISOString().slice(0, 10),
      category: item.category
        ? { id: item.category.id, name: item.category.name }
        : null,
    };
  }
}
