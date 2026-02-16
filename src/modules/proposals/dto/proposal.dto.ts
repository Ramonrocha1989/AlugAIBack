import { z } from 'zod';

export const CreateProposalSchema = z.object({
  machineId: z.string().uuid(),
  proposedPrice: z.number().positive(),
  message: z.string().min(10).max(1000),
});

export const CounterProposalSchema = z.object({
  counterPrice: z.number().positive(),
  counterMessage: z.string().min(10).max(1000),
});

export type CreateProposalDto = z.infer<typeof CreateProposalSchema>;
export type CounterProposalDto = z.infer<typeof CounterProposalSchema>;
