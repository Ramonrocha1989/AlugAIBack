import { z } from 'zod';

export const CreateEquipmentSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  dailyPrice: z.number().positive(),
  location: z.string().min(2),
  category: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
});

export const UpdateEquipmentSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  pricePerDay: z.number().positive().optional(),
  location: z.string().min(2).optional(),
  images: z.array(z.string().url()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateEquipmentDto = z.infer<typeof CreateEquipmentSchema>;
export type UpdateEquipmentDto = z.infer<typeof UpdateEquipmentSchema>;
