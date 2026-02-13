import { z } from 'zod';

export const AddFavoriteSchema = z.object({
  machineId: z.string().uuid('ID da máquina inválido'),
});

export type AddFavoriteDto = z.infer<typeof AddFavoriteSchema>;
