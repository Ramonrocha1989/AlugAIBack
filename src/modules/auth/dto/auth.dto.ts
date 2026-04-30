import { z } from 'zod';
import { validateDocument, normalizeDocument } from '../../../common/utils/document-validator';

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
  userType: z.enum(['INDIVIDUAL', 'COMPANY'], { required_error: 'Tipo de usuário obrigatório' }),
  fullName: z.string().min(2, 'Nome completo muito curto').optional(),
  cpf: z.string()
    .optional()
    .refine(
      (doc) => !doc || validateDocument(doc),
      'CPF inválido'
    )
    .transform((doc) => doc ? normalizeDocument(doc) : undefined),
  companyName: z.string().min(2, 'Nome da empresa muito curto').optional(),
  cnpj: z.string()
    .optional()
    .refine(
      (doc) => !doc || validateDocument(doc),
      'CNPJ inválido'
    )
    .transform((doc) => doc ? normalizeDocument(doc) : undefined),
  responsibleName: z.string().min(2, 'Nome do responsável muito curto').optional(),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido (formato: 51999887766)'),
}).refine(
  (data) => {
    if (data.userType === 'INDIVIDUAL') {
      return !!data.fullName;
    }
    return !!data.companyName && !!data.responsibleName;
  },
  {
    message: 'Campos obrigatórios não preenchidos',
    path: ['userType'],
  }
);

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

export const UpgradePlanSchema = z.object({
  plan: z.enum(['free', 'lojista'], { required_error: 'Plano obrigatório' }),
  userId: z.string().uuid('userId inválido').optional(),
});

export type UpgradePlanDto = z.infer<typeof UpgradePlanSchema>;
