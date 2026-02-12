-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('SALE', 'RENTAL', 'EXCHANGE', 'SERVICE');

-- CreateEnum
CREATE TYPE "MachineCategory" AS ENUM ('TRACTORS', 'HARVESTERS', 'PLANTING', 'SPRAYING', 'HAYMAKING', 'IMPLEMENTS', 'LIVESTOCK', 'CONSTRUCTION');

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "MachineCategory" NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yearModel" INTEGER NOT NULL,
    "power" INTEGER,
    "engineHours" INTEGER,
    "serialNumber" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "acceptsTradeDown" BOOLEAN NOT NULL DEFAULT false,
    "acceptsTradeUp" BOOLEAN NOT NULL DEFAULT false,
    "acceptsGrains" BOOLEAN NOT NULL DEFAULT false,
    "acceptsFinancing" BOOLEAN NOT NULL DEFAULT false,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zipCode" TEXT,
    "images" TEXT[],
    "videoUrl" TEXT,
    "quickTags" TEXT[],
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerPhone" TEXT,
    "isVerifiedSeller" BOOLEAN NOT NULL DEFAULT false,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "machines_category_idx" ON "machines"("category");

-- CreateIndex
CREATE INDEX "machines_businessType_idx" ON "machines"("businessType");

-- CreateIndex
CREATE INDEX "machines_state_idx" ON "machines"("state");

-- CreateIndex
CREATE INDEX "machines_city_idx" ON "machines"("city");

-- CreateIndex
CREATE INDEX "machines_manufacturer_idx" ON "machines"("manufacturer");

-- CreateIndex
CREATE INDEX "machines_yearModel_idx" ON "machines"("yearModel");

-- CreateIndex
CREATE INDEX "machines_engineHours_idx" ON "machines"("engineHours");

-- CreateIndex
CREATE INDEX "machines_power_idx" ON "machines"("power");

-- CreateIndex
CREATE INDEX "machines_ownerId_idx" ON "machines"("ownerId");

-- CreateIndex
CREATE INDEX "machines_price_idx" ON "machines"("price");

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
