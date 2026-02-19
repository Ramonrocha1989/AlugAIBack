-- AlterTable
ALTER TABLE "users" ADD COLUMN "maxPremiumAds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "maxFeaturedAds" INTEGER NOT NULL DEFAULT 0;

-- Update existing lojista users
UPDATE "users" SET "maxPremiumAds" = 3, "maxFeaturedAds" = 5 WHERE "plan" = 'lojista';
