import { TransactionType } from '@prisma/client';

export const DEFAULT_CATEGORIES: { name: string; type: TransactionType }[] = [
  { name: 'Salário', type: 'INCOME' },
  { name: 'Freelance', type: 'INCOME' },
  { name: 'Rendimentos', type: 'INCOME' },
  { name: 'Outros', type: 'INCOME' },
  { name: 'Moradia', type: 'EXPENSE' },
  { name: 'Alimentação', type: 'EXPENSE' },
  { name: 'Transporte', type: 'EXPENSE' },
  { name: 'Saúde', type: 'EXPENSE' },
  { name: 'Educação', type: 'EXPENSE' },
  { name: 'Lazer', type: 'EXPENSE' },
  { name: 'Contas', type: 'EXPENSE' },
  { name: 'Outros', type: 'EXPENSE' },
];
