#!/bin/bash

# Script para aplicar a migration de diferenciação de usuários

echo "🚀 Aplicando migration: add_user_type_differentiation"

# Aplicar migration
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate

echo "✅ Migration aplicada com sucesso!"
echo ""
echo "📝 Resumo das mudanças:"
echo "  - Adicionado enum UserType (INDIVIDUAL, COMPANY)"
echo "  - Adicionado campo user_type na tabela users"
echo "  - Adicionado campo full_name para pessoas físicas"
echo "  - Adicionado campo cpf para pessoas físicas"
echo "  - Adicionado campo responsible_name para empresas"
echo "  - Campo companyId agora é opcional"
echo ""
echo "🔄 Para testar, reinicie o servidor: npm run start:dev"
