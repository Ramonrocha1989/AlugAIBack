-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "viewedByReceiver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "viewedBySender" BOOLEAN NOT NULL DEFAULT false;
