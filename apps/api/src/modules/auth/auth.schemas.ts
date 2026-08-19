import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha muito longa')
  .regex(/[A-Za-z]/, 'A senha deve conter letras')
  .regex(/\d/, 'A senha deve conter números');

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome')
    .max(80, 'Nome muito longo'),
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  password: passwordSchema,
  inviteToken: z.string().min(20).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  password: z.string().min(1, 'Informe a senha').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Informe seu nome')
      .max(80, 'Nome muito longo'),
  })
  .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual').max(128),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((input) => input.currentPassword !== input.newPassword, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['newPassword'],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const inviteMemberSchema = z.object({
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(20, 'Convite inválido'),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
