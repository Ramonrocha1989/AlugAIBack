-- Migration: Add account deletion support
-- Execute este SQL diretamente no seu banco PostgreSQL

BEGIN;

-- 1. Adicionar campos na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'ACTIVE';

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS "users_status_idx" ON users("status");
CREATE INDEX IF NOT EXISTS "users_deletedAt_idx" ON users("deletedAt");

-- 3. Criar tabela delete_tokens
CREATE TABLE IF NOT EXISTS "delete_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delete_tokens_pkey" PRIMARY KEY ("id")
);

-- 4. Criar índices na tabela delete_tokens
CREATE UNIQUE INDEX IF NOT EXISTS "delete_tokens_token_key" ON "delete_tokens"("token");
CREATE INDEX IF NOT EXISTS "delete_tokens_token_idx" ON "delete_tokens"("token");
CREATE INDEX IF NOT EXISTS "delete_tokens_expiresAt_idx" ON "delete_tokens"("expiresAt");

-- 5. Adicionar foreign key
ALTER TABLE "delete_tokens" 
ADD CONSTRAINT "delete_tokens_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
