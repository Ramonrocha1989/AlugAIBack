-- DropIndex
DROP INDEX IF EXISTS "companies_document_key";

-- AlterTable: add documentHash as nullable first
ALTER TABLE "companies" ADD COLUMN "documentHash" TEXT;

-- Populate documentHash with SHA-256 of existing document values
UPDATE "companies" SET "documentHash" = encode(sha256(convert_to("document", 'UTF8')), 'hex');

-- Make documentHash required
ALTER TABLE "companies" ALTER COLUMN "documentHash" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "companies_documentHash_key" ON "companies"("documentHash");
