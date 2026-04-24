-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banner" TEXT,
ADD COLUMN     "businessHours" TEXT,
ADD COLUMN     "categoriesWorked" TEXT[],
ADD COLUMN     "gallery" TEXT[],
ADD COLUMN     "logo" TEXT;
