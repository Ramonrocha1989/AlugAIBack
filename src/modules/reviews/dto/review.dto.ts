import { z } from 'zod';

export const CreateReviewSchema = z.object({
  reviewedUserId: z.string().uuid('ID do usuário inválido'),
  machineId: z.string().uuid('ID da máquina inválido').optional().nullable(),
  rating: z.coerce.number().int().min(1, 'Rating mínimo é 1').max(5, 'Rating máximo é 5'),
  comment: z.string().optional().nullable(),
});

export const UpdateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().optional().nullable(),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewDto = z.infer<typeof UpdateReviewSchema>;
