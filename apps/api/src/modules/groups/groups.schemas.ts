import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe o nome do grupo')
    .max(80, 'Nome muito longo'),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
