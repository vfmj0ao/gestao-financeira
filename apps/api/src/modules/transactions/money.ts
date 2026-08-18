import { Prisma } from '@prisma/client';

export function parseMoney(value: string): Prisma.Decimal {
  return parseDecimal(value, 2);
}

export function parseDecimal(value: string, maxPlaces: number): Prisma.Decimal {
  const normalized = value.replace(',', '.').trim();
  const amount = new Prisma.Decimal(normalized);
  if (amount.lte(0) || amount.decimalPlaces() > maxPlaces) {
    throw new Error('INVALID_AMOUNT');
  }
  return amount.toDecimalPlaces(maxPlaces);
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

export function currentUtcMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function trailingMonths(
  count: number,
  endMonth = currentUtcMonth(),
): { months: string[]; gte: Date; lt: Date } {
  const [yearRaw, monthRaw] = endMonth.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const start = new Date(Date.UTC(year, monthIndex - count + 1, 1));
  const months: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const date = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
    );
    months.push(
      `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
    );
  }
  return { months, gte: start, lt: monthRange(endMonth).lt };
}
