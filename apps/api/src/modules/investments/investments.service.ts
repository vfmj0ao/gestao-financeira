import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MembershipAccessService } from '../../common/auth/membership-access.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { dateFromDay, formatMoney, parseDecimal } from '../transactions/money';
import type { CreateInvestmentInput } from './investments.schemas';
import { InvestmentsRepository } from './investments.repository';

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly investmentsRepository: InvestmentsRepository,
    private readonly membershipAccess: MembershipAccessService,
  ) {}

  async list(user: AuthenticatedUser, groupId: string) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'INVESTMENTS_READ',
    );
    const items = await this.investmentsRepository.listByGroup(groupId);
    return items.map((item) => this.toPublic(item));
  }

  async summary(user: AuthenticatedUser, groupId: string) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'INVESTMENTS_READ',
    );
    const total = await this.investmentsRepository.sumAmount(groupId);
    return {
      total: formatMoney(total._sum.amount ?? new Prisma.Decimal(0)),
    };
  }

  async create(
    user: AuthenticatedUser,
    groupId: string,
    input: CreateInvestmentInput,
  ) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'INVESTMENTS_CREATE',
    );
    const created = await this.investmentsRepository.create({
      groupId,
      ...this.parseInput(input),
    });
    return this.toPublic(created);
  }

  async update(
    user: AuthenticatedUser,
    groupId: string,
    investmentId: string,
    input: CreateInvestmentInput,
  ) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'INVESTMENTS_UPDATE',
    );
    const existing = await this.investmentsRepository.findInGroup(
      investmentId,
      groupId,
    );
    if (!existing) {
      throw new NotFoundException('Investimento não encontrado');
    }
    const updated = await this.investmentsRepository.update(
      existing.id,
      this.parseInput(input),
    );
    return this.toPublic(updated);
  }

  async remove(user: AuthenticatedUser, groupId: string, investmentId: string) {
    await this.membershipAccess.requirePermission(
      user.id,
      groupId,
      'INVESTMENTS_DELETE',
    );
    const existing = await this.investmentsRepository.findInGroup(
      investmentId,
      groupId,
    );
    if (!existing) {
      throw new NotFoundException('Investimento não encontrado');
    }
    await this.investmentsRepository.delete(existing.id);
    return { ok: true as const };
  }

  private parseInput(input: CreateInvestmentInput) {
    let amount: Prisma.Decimal;
    try {
      amount = parseDecimal(input.amount, 4);
    } catch {
      throw new BadRequestException('Informe um valor aplicado maior que zero');
    }

    let quantity: Prisma.Decimal | null = null;
    if (input.quantity && input.quantity.length > 0) {
      try {
        quantity = parseDecimal(input.quantity, 8);
      } catch {
        throw new BadRequestException(
          'Informe uma quantidade válida maior que zero',
        );
      }
    }

    return {
      name: input.name,
      ticker: input.ticker ? input.ticker.toUpperCase() : null,
      amount,
      quantity,
      investedAt: dateFromDay(input.investedOn),
    };
  }

  private toPublic(item: {
    id: string;
    name: string;
    ticker: string | null;
    amount: Prisma.Decimal;
    quantity: Prisma.Decimal | null;
    investedAt: Date;
  }) {
    return {
      id: item.id,
      name: item.name,
      ticker: item.ticker,
      amount: formatMoney(item.amount),
      quantity: item.quantity
        ? item.quantity.toFixed(8).replace(/\.?0+$/, '')
        : null,
      investedOn: item.investedAt.toISOString().slice(0, 10),
    };
  }
}
