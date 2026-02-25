import { z } from 'zod';
import { validateDocument, normalizeDocument } from '../../../common/utils/document-validator';

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
  companyName: z.string().min(2, 'Nome da empresa muito curto'),
  name: z.string().min(2, 'Nome muito curto').optional(),
  companyDocument: z.string()
    .optional()
    .refine(
      (doc) => !doc || validateDocument(doc),
      'CPF ou CNPJ inválido'
    )
    .transform((doc) => doc ? normalizeDocument(doc) : undefined),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido (formato: 51999887766)'),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
