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
