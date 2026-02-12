import { z } from 'zod';

export const BusinessTypeEnum = z.enum(['SALE', 'RENTAL', 'EXCHANGE', 'SERVICE']);
export const MachineCategoryEnum = z.enum([
  'TRACTORS',
  'HARVESTERS',
  'PLANTING',
  'SPRAYING',
  'HAYMAKING',
  'IMPLEMENTS',
  'LIVESTOCK',
  'CONSTRUCTION',
]);

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
  name: z.string().min(5, 'Nome deve ter no mínimo 5 caracteres'),
  description: z.string().min(50, 'Descrição deve ter no mínimo 50 caracteres'),
  category: MachineCategoryEnum,
  manufacturer: z.string().min(2, 'Fabricante obrigatório'),
  model: z.string().min(1, 'Modelo obrigatório'),
  yearModel: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  power: z.number().int().positive().optional(),
  engineHours: z.number().int().min(0).optional(),
  serialNumber: z.string().optional(),
  price: z.number().positive('Preço deve ser maior que zero'),
  acceptsTradeDown: z.boolean().default(false),
  acceptsTradeUp: z.boolean().default(false),
  acceptsGrains: z.boolean().default(false),
  acceptsFinancing: z.boolean().default(false),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (UF)').toUpperCase(),
  city: z.string().min(2, 'Cidade obrigatória'),
  zipCode: z.string().optional(),
  images: z.array(z.string().url()).min(1, 'Mínimo 1 imagem').max(10, 'Máximo 10 imagens'),
  videoUrl: z.string().url().optional(),
  quickTags: z.array(QuickTagsEnum).default([]),
  ownerPhone: z.string().regex(/^55\d{10,11}$/, 'Telefone inválido (formato: 5551999887766)').optional(),
});

export const UpdateMachineSchema = CreateMachineSchema.partial();

export const MachineFiltersSchema = z.object({
  search: z.string().optional(),
  category: MachineCategoryEnum.optional(),
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
  minPower: z.number().int().positive().optional(),
  maxPower: z.number().int().positive().optional(),
  acceptsTradeDown: z.boolean().optional(),
  acceptsTradeUp: z.boolean().optional(),
  acceptsGrains: z.boolean().optional(),
  isVerifiedSeller: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type CreateMachineDto = z.infer<typeof CreateMachineSchema>;
export type UpdateMachineDto = z.infer<typeof UpdateMachineSchema>;
export type MachineFiltersDto = z.infer<typeof MachineFiltersSchema>;
