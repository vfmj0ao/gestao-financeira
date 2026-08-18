import { Prisma } from '@prisma/client';

export function parseMoney(value: string): Prisma.Decimal {
  const normalized = value.replace(',', '.').trim();
  const amount = new Prisma.Decimal(normalized);
  if (amount.lte(0) || amount.decimalPlaces() > 2) {
    throw new Error('INVALID_AMOUNT');
  }
  return amount.toDecimalPlaces(2);
}

export function formatMoney(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

export function monthRange(month: string): { gte: Date; lt: Date } {
  const [yearRaw, monthRaw] = month.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  return {
    gte: new Date(Date.UTC(year, monthIndex, 1)),
    lt: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

export function dateFromDay(occurredOn: string): Date {
  return new Date(`${occurredOn}T12:00:00.000Z`);
}
