#!/bin/bash

# Script de teste para exclusão de conta

BASE_URL="http://localhost:3000"
EMAIL="test-delete@example.com"
PASSWORD="senha123"
COMPANY_NAME="Empresa Teste Delete"
COMPANY_DOC="12345678901234"

echo "=== Teste de Exclusão de Conta ==="
echo ""

# 1. Registrar usuário
echo "1. Registrando usuário..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"companyName\": \"$COMPANY_NAME\",
    \"companyDocument\": \"$COMPANY_DOC\",
    \"phone\": \"51999999999\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
echo ""

# 2. Verificar email (simular)
echo "2. Verificando email..."
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
# Você precisará pegar o token do banco ou email
echo "⚠️  Verifique o email manualmente ou atualize o banco: UPDATE users SET email_verified = true WHERE id = '$USER_ID'"
echo ""

# 3. Solicitar exclusão com senha incorreta
echo "3. Testando solicitação com senha incorreta..."
curl -s -X POST "$BASE_URL/auth/request-delete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"password\": \"senhaerrada\"
  }" | jq '.'
echo ""

# 4. Solicitar exclusão com senha correta
echo "4. Solicitando exclusão com senha correta..."
DELETE_REQUEST=$(curl -s -X POST "$BASE_URL/auth/request-delete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"password\": \"$PASSWORD\"
  }")

echo "$DELETE_REQUEST" | jq '.'
echo ""

# 5. Pegar token do banco
echo "5. Pegue o token do banco de dados:"
echo "   SELECT token FROM delete_tokens WHERE user_id = '$USER_ID' ORDER BY created_at DESC LIMIT 1;"
echo ""
read -p "Cole o token aqui: " DELETE_TOKEN
echo ""

# 6. Confirmar exclusão com token inválido
echo "6. Testando confirmação com token inválido..."
curl -s -X POST "$BASE_URL/auth/confirm-delete" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"token-invalido-123\"
  }" | jq '.'
echo ""

# 7. Confirmar exclusão com token válido
echo "7. Confirmando exclusão com token válido..."
curl -s -X POST "$BASE_URL/auth/confirm-delete" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$DELETE_TOKEN\"
  }" | jq '.'
echo ""

# 8. Verificar status no banco
echo "8. Verifique o status no banco:"
echo "   SELECT id, email, status, deleted_at FROM users WHERE email = '$EMAIL';"
echo ""

# 9. Tentar fazer login
echo "9. Tentando fazer login (deve falhar)..."
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }" | jq '.'
echo ""

echo "=== Teste Concluído ==="
echo ""
echo "Próximos passos:"
echo "1. Verifique os emails enviados"
echo "2. Verifique o banco de dados"
echo "3. Aguarde 30 dias ou ajuste a data manualmente:"
echo "   UPDATE users SET deleted_at = NOW() - INTERVAL '31 days' WHERE email = '$EMAIL';"
echo "4. Execute o cron job manualmente ou aguarde às 3h da manhã"
