import { z } from 'zod';

export const monthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês no formato AAAA-MM')
    .optional(),
});
export type MonthQuery = z.infer<typeof monthQuerySchema>;

const moneyString = z
  .string()
  .trim()
  .regex(/^\d{1,12}([.,]\d{1,2})?$/, 'Informe um valor válido, como 1500,00');

export const upsertBudgetsSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês no formato AAAA-MM'),
  items: z
    .array(
      z.object({
        categoryId: z.string().min(1, 'Escolha uma categoria'),
        amount: moneyString.nullable(),
      }),
    )
    .max(80),
});
export type UpsertBudgetsInput = z.infer<typeof upsertBudgetsSchema>;

export const copyBudgetsSchema = z.object({
  fromMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês no formato AAAA-MM'),
  toMonth: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês no formato AAAA-MM'),
});
export type CopyBudgetsInput = z.infer<typeof copyBudgetsSchema>;
