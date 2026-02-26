#!/bin/bash

# Script para aplicar migration de exclusão de conta

echo "=== Aplicando Migration de Exclusão de Conta ==="
echo ""

# Ler DATABASE_URL do .env
if [ -f .env ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
else
    echo "❌ Arquivo .env não encontrado"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não encontrada no .env"
    exit 1
fi

echo "✅ DATABASE_URL encontrada"
echo ""

# Aplicar SQL
echo "Aplicando migration..."
psql "$DATABASE_URL" -f migration-delete-account.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration aplicada com sucesso!"
    echo ""
    echo "Gerando Prisma Client..."
    npx prisma generate
    echo ""
    echo "✅ Pronto! Reinicie o servidor."
else
    echo ""
    echo "❌ Erro ao aplicar migration"
    exit 1
fi
