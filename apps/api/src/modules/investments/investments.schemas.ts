import { z } from 'zod';

export const createInvestmentSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome').max(80, 'Nome muito longo'),
  ticker: z.string().trim().max(20, 'Ticker muito longo').optional(),
  amount: z
    .string()
    .trim()
    .regex(/^\d{1,12}([.,]\d{1,4})?$/, 'Informe um valor válido'),
  quantity: z.string().trim().optional(),
  investedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida'),
});
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
