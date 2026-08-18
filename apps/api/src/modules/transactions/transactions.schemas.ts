import { z } from 'zod';

export const monthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês no formato AAAA-MM')
    .optional(),
});
export type MonthQuery = z.infer<typeof monthQuerySchema>;

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,12}([.,]\d{1,2})?$/, 'Informe um valor válido, como 1500,00'),
  description: z
    .string()
    .trim()
    .min(2, 'Informe uma descrição')
    .max(120, 'Descrição muito longa'),
  occurredOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida'),
  categoryId: z.string().min(1, 'Escolha uma categoria'),
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
