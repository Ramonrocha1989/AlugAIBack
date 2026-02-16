import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido (formato: 51999887766)').optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
