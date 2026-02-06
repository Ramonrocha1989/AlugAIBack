import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().min(2),
  name: z.string().min(2).optional(),
  companyDocument: z.string().min(11).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
