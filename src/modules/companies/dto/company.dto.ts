import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  description: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  businessHours: z.string().optional(),
  categoriesWorked: z.array(z.string()).optional(),
  gallery: z.array(z.string()).optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
