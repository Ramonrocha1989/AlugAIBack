-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "emailSupport" TEXT,
ADD COLUMN     "maintenanceMessage" TEXT,
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneSupport" TEXT,
ADD COLUMN     "privacyPolicy" TEXT,
ADD COLUMN     "socialLinks" JSONB NOT NULL DEFAULT '{"instagram":"","facebook":"","youtube":"","linkedin":""}',
ADD COLUMN     "termsOfUse" TEXT,
ADD COLUMN     "whatsappSupport" TEXT,
ALTER COLUMN "siteName" SET DEFAULT 'BaitaBriq';

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
