import { z } from 'zod';

export const RequestVerificationSchema = z.object({
  documentType: z.enum(['CPF', 'CNPJ']),
  documentNumber: z.string().min(1),
  companyName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  reason: z.string().optional(),
});

export const RejectVerificationSchema = z.object({
  reason: z.string().optional(),
});

export type RequestVerificationDto = z.infer<typeof RequestVerificationSchema>;
export type RejectVerificationDto = z.infer<typeof RejectVerificationSchema>;
