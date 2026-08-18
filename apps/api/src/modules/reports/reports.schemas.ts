import { z } from 'zod';

export const reportQuerySchema = z.object({
  months: z.enum(['6', '12', '24']).optional(),
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;
