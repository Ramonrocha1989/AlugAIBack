-- CreateTable
CREATE TABLE "plans" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxAds" INTEGER NOT NULL DEFAULT 2,
    "maxPhotos" INTEGER NOT NULL DEFAULT 3,
    "maxVideos" INTEGER NOT NULL DEFAULT 0,
    "adDuration" INTEGER NOT NULL DEFAULT 30,
    "maxPremiumAds" INTEGER NOT NULL DEFAULT 0,
    "maxFeaturedAds" INTEGER NOT NULL DEFAULT 0,
    "hasAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "analyticsLevel" VARCHAR(20) NOT NULL DEFAULT 'none',
    "hasPriority" BOOLEAN NOT NULL DEFAULT false,
    "hasStorePage" BOOLEAN NOT NULL DEFAULT false,
    "hasVerifiedBadge" BOOLEAN NOT NULL DEFAULT false,
    "supportLevel" VARCHAR(20) NOT NULL DEFAULT 'email_48h',
    "features" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);
