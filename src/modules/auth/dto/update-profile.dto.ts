import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^\d{10,11}$/).optional(),
}).refine(data => data.name || data.phone, {
  message: 'Pelo menos um campo deve ser fornecido',
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
