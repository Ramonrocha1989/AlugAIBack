import { z } from 'zod';

export const GetNotificationsSchema = z.object({
  read: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type GetNotificationsDto = z.infer<typeof GetNotificationsSchema>;
