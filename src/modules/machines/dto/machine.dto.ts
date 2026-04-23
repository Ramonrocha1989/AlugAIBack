import { z } from 'zod';

export const BusinessTypeEnum = z.enum(['SALE', 'RENTAL', 'EXCHANGE', 'SERVICE']);


export const QuickTagsEnum = z.enum([
  'NEW_TIRES',
  'ORIGINAL_CABIN',
  'AUTHORIZED_SERVICE',
  'GPS_INTEGRATED',
  'AIR_CONDITIONING',
  'SINGLE_OWNER',
  'COMPLETE_DOCS',
]);

export const CreateMachineSchema = z.object({
  businessType: BusinessTypeEnum,
  name: z.string()
    .min(5, 'Nome deve ter no mínimo 5 caracteres')
    .max(200, 'Nome deve ter no máximo 200 caracteres')
    .trim(),
  description: z.string()
    .min(50, 'Descrição deve ter no mínimo 50 caracteres')
    .max(5000, 'Descrição deve ter no máximo 5000 caracteres')
    .trim(),
  category: z.string().min(1, 'Categoria obrigatória'),
  manufacturer: z.string().min(2, 'Fabricante obrigatório').max(100).trim(),
  model: z.string().min(1, 'Modelo obrigatório').max(100).trim(),
  yearModel: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  power: z.number().positive().max(9999).optional(),
  engineHours: z.number().int().min(0).max(999999).optional(),
  serialNumber: z.string().max(100).optional(),
  price: z.number().positive('Preço deve ser maior que zero').max(999999999),
  acceptsTradeDown: z.boolean().default(false),
  acceptsTradeUp: z.boolean().default(false),
  acceptsGrains: z.boolean().default(false),
  acceptsFinancing: z.boolean().default(false),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)').toUpperCase(),
  city: z.string().min(2, 'Cidade obrigatória').max(100).trim(),
  zipCode: z.string().regex(/^\d{8}$/, 'CEP inválido (8 dígitos)').optional(),
  images: z.array(z.string().url('URL de imagem inválida')).min(1, 'Mínimo 1 imagem').max(15, 'Máximo 15 imagens'),
  videoUrl: z.string().url('URL de vídeo inválida').optional(),
  quickTags: z.array(QuickTagsEnum).max(10).default([]),
  ownerPhone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido (formato: 51999887766)').optional(),
});

export const UpdateMachineSchema = CreateMachineSchema.partial().extend({
  isPremium: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  available: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'INACTIVE']).optional(),
});

export const MachineFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  businessType: BusinessTypeEnum.optional(),
  manufacturer: z.string().optional(),
  state: z.string().length(2).toUpperCase().optional(),
  city: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minYear: z.number().int().optional(),
  maxYear: z.number().int().optional(),
  minEngineHours: z.number().int().min(0).optional(),
  maxEngineHours: z.number().int().min(0).optional(),
  minPower: z.number().positive().optional(),
  maxPower: z.number().positive().optional(),
  acceptsTradeDown: z.boolean().optional(),
  acceptsTradeUp: z.boolean().optional(),
  acceptsGrains: z.boolean().optional(),
  isVerifiedSeller: z.boolean().optional(),
  sortBy: z.enum(['recent', 'created_desc', 'price_asc', 'price_desc', 'engine_hours_asc', 'year_desc']).default('recent'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type CreateMachineDto = z.infer<typeof CreateMachineSchema>;
export type UpdateMachineDto = z.infer<typeof UpdateMachineSchema>;
export type MachineFiltersDto = z.infer<typeof MachineFiltersSchema>;
