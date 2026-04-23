import { z } from 'zod';

export const BanUserSchema = z.object({
  isBanned: z.boolean(),
});

export const VerifySellerSchema = z.object({
  isVerifiedSeller: z.boolean(),
});

export const UpdateMachineStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PENDING', 'REJECTED']),
});

export const FeatureMachineSchema = z.object({
  isFeatured: z.boolean(),
});

export const UpdateSettingsSchema = z.object({
  siteName: z.string().optional(),
  homeTitle: z.string().optional(),
  homeDescription: z.string().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  whatsappSupport: z.string().optional(),
  phoneSupport: z.string().optional(),
  emailSupport: z.string().optional(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
  termsOfUse: z.string().optional(),
  privacyPolicy: z.string().optional(),
});

export const CreateBannerSchema = z.object({
  imageUrl: z.string().url(),
  link: z.string().optional(),
  active: z.boolean().default(true),
});

export type BanUserDto = z.infer<typeof BanUserSchema>;
export type VerifySellerDto = z.infer<typeof VerifySellerSchema>;
export type UpdateMachineStatusDto = z.infer<typeof UpdateMachineStatusSchema>;
export type FeatureMachineDto = z.infer<typeof FeatureMachineSchema>;
export type UpdateSettingsDto = z.infer<typeof UpdateSettingsSchema>;
export type CreateBannerDto = z.infer<typeof CreateBannerSchema>;

export const UpdateUserPlanSchema = z.object({
  plan: z.enum(['free', 'basico', 'profissional', 'premium']),
  expiresAt: z.string().datetime().nullable().optional(),
});

export type UpdateUserPlanDto = z.infer<typeof UpdateUserPlanSchema>;

export const CreateCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const ReorderCategorySchema = z.object({
  order: z.number().int().min(0),
});

export const UpdatePlanSchema = z.object({
  name: z.string().optional(),
  price: z.number().min(0).optional(),
  maxAds: z.number().int().min(0).optional(),
  maxPhotos: z.number().int().min(0).optional(),
  maxVideos: z.number().int().min(0).optional(),
  adDuration: z.number().int().min(0).optional(),
  maxPremiumAds: z.number().int().min(0).optional(),
  maxFeaturedAds: z.number().int().min(0).optional(),
  hasAnalytics: z.boolean().optional(),
  analyticsLevel: z.string().optional(),
  hasPriority: z.boolean().optional(),
  hasStorePage: z.boolean().optional(),
  hasVerifiedBadge: z.boolean().optional(),
  supportLevel: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
export type ReorderCategoryDto = z.infer<typeof ReorderCategorySchema>;
export type UpdatePlanDto = z.infer<typeof UpdatePlanSchema>;
