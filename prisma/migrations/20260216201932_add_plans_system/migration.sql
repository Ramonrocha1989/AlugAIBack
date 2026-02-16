-- AlterTable
ALTER TABLE "equipments" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualifiedLeads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "whatsappClicks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "maxAds" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free';

-- CreateIndex
CREATE INDEX "equipments_isPremium_idx" ON "equipments"("isPremium");

-- CreateIndex
CREATE INDEX "users_plan_idx" ON "users"("plan");
