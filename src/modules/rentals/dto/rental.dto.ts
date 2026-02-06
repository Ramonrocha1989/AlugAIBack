import { z } from 'zod';

export const CreateRentalSchema = z.object({
  equipmentId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
});

export type CreateRentalDto = z.infer<typeof CreateRentalSchema>;
