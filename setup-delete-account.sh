#!/bin/bash

# Script para aplicar a migration de exclusão de conta

echo "=== Aplicando Migration de Exclusão de Conta ==="
echo ""

# 1. Verificar se o banco está rodando
echo "1. Verificando conexão com o banco..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Erro: Banco de dados não está acessível"
    echo "   Certifique-se de que o PostgreSQL está rodando"
    exit 1
fi
echo "✅ Banco de dados acessível"
echo ""

# 2. Fazer backup (opcional mas recomendado)
echo "2. Recomendamos fazer backup do banco antes de continuar"
read -p "Deseja continuar? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada"
    exit 0
fi
echo ""

# 3. Aplicar migration
echo "3. Aplicando migration..."
echo ""
echo "Execute o seguinte comando manualmente (requer interação):"
echo ""
echo "  npx prisma migrate dev --name add_account_deletion"
echo ""
echo "Ou, se estiver em produção:"
echo ""
echo "  npx prisma migrate deploy"
echo ""

# 4. Gerar Prisma Client
echo "4. Gerando Prisma Client..."
npx prisma generate
echo ""

# 5. Verificar tabelas criadas
echo "5. Verificando se as tabelas foram criadas..."
TABLES=$(npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('delete_tokens');" 2>/dev/null | grep delete_tokens)

if [ -z "$TABLES" ]; then
    echo "⚠️  Tabela delete_tokens não encontrada"
    echo "   Execute a migration manualmente"
else
    echo "✅ Tabela delete_tokens criada com sucesso"
fi
echo ""

# 6. Verificar campos adicionados
echo "6. Verificando campos adicionados na tabela users..."
COLUMNS=$(npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('deleted_at', 'status');" 2>/dev/null)

if echo "$COLUMNS" | grep -q "deleted_at" && echo "$COLUMNS" | grep -q "status"; then
    echo "✅ Campos deleted_at e status adicionados com sucesso"
else
    echo "⚠️  Campos não encontrados"
    echo "   Execute a migration manualmente"
fi
echo ""

echo "=== Setup Concluído ==="
echo ""
echo "Próximos passos:"
echo "1. Iniciar o servidor: npm run start:dev"
echo "2. Testar os endpoints: ./test-delete-account.sh"
echo "3. Verificar documentação: DELETE_ACCOUNT_QUICKSTART.md"
