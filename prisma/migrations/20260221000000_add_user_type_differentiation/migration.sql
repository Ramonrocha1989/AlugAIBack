-- CreateEnum (skip if exists)
DO $$ BEGIN
 CREATE TYPE "UserType" AS ENUM ('INDIVIDUAL', 'COMPANY');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "user_type" "UserType" DEFAULT 'COMPANY';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cpf" VARCHAR(14);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "responsible_name" VARCHAR(255);
ALTER TABLE "users" ALTER COLUMN "companyId" DROP NOT NULL;

-- Migrar dados existentes
UPDATE "users" SET "user_type" = 'COMPANY' WHERE "user_type" IS NULL;

-- Tornar user_type obrigatório
ALTER TABLE "users" ALTER COLUMN "user_type" SET NOT NULL;
