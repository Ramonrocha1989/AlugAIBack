-- AlterTable
ALTER TABLE "machines" ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualifiedLeads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "whatsappClicks" INTEGER NOT NULL DEFAULT 0;
