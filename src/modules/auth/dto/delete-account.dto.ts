import { z } from 'zod';

export const RequestDeleteSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const ConfirmDeleteSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
});

export type RequestDeleteDto = z.infer<typeof RequestDeleteSchema>;
export type ConfirmDeleteDto = z.infer<typeof ConfirmDeleteSchema>;
