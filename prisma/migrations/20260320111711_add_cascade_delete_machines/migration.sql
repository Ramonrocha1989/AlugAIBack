/*
  Warnings:

  - You are about to drop the column `full_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `responsible_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `user_type` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `equipments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rentals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "equipments" DROP CONSTRAINT "equipments_companyId_fkey";

-- DropForeignKey
ALTER TABLE "machines" DROP CONSTRAINT "machines_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_rentalId_fkey";

-- DropForeignKey
ALTER TABLE "rentals" DROP CONSTRAINT "rentals_equipmentId_fkey";

-- DropForeignKey
ALTER TABLE "rentals" DROP CONSTRAINT "rentals_renterCompanyId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "full_name",
DROP COLUMN "responsible_name",
DROP COLUMN "user_type",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "responsibleName" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'COMPANY',
ALTER COLUMN "cpf" SET DATA TYPE TEXT,
ALTER COLUMN "companyName" SET DATA TYPE TEXT,
ALTER COLUMN "website" SET DATA TYPE TEXT,
ALTER COLUMN "location" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "equipments";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "rentals";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "RentalStatus";

-- CreateTable
CREATE TABLE "delete_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delete_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delete_tokens_token_key" ON "delete_tokens"("token");

-- CreateIndex
CREATE INDEX "delete_tokens_token_idx" ON "delete_tokens"("token");

-- CreateIndex
CREATE INDEX "delete_tokens_expiresAt_idx" ON "delete_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- AddForeignKey
ALTER TABLE "delete_tokens" ADD CONSTRAINT "delete_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
