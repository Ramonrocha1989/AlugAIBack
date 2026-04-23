-- 1. Converter coluna de enum para text (sem perder dados)
ALTER TABLE "machines" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;

-- 2. Migrar valores do enum para slugs da tabela categories
UPDATE "machines" SET "category" = 'tratores' WHERE "category" = 'TRACTORS';
UPDATE "machines" SET "category" = 'colheitadeiras' WHERE "category" = 'HARVESTERS';
UPDATE "machines" SET "category" = 'plantio-e-semeadura' WHERE "category" = 'PLANTING';
UPDATE "machines" SET "category" = 'pulverizacao' WHERE "category" = 'SPRAYING';
UPDATE "machines" SET "category" = 'fenacao-e-silagem' WHERE "category" = 'HAYMAKING';
UPDATE "machines" SET "category" = 'implementos-e-acoplados' WHERE "category" = 'IMPLEMENTS';
UPDATE "machines" SET "category" = 'pecuaria-e-outros' WHERE "category" = 'LIVESTOCK';
UPDATE "machines" SET "category" = 'construcao-linha-amarela' WHERE "category" = 'CONSTRUCTION';

-- 3. Remover o enum antigo
DROP TYPE "MachineCategory";
