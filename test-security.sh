#!/bin/bash

# 🔒 Script de Testes de Segurança
# Execute: chmod +x test-security.sh && ./test-security.sh

API_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 TESTES DE SEGURANÇA - Backend"
echo "================================"
echo ""

# 1. Testar Senha Fraca
echo "1️⃣  Testando validação de senha fraca..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "123",
    "companyName": "Test",
    "phone": "51999887766"
  }')

if echo "$RESPONSE" | grep -q "Senha deve ter no mínimo 8 caracteres"; then
  echo -e "${GREEN}✅ PASSOU: Senha fraca rejeitada${NC}"
else
  echo -e "${RED}❌ FALHOU: Senha fraca aceita${NC}"
fi
echo ""

# 2. Testar Senha sem Maiúscula
echo "2️⃣  Testando senha sem maiúscula..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@test.com",
    "password": "senha123",
    "companyName": "Test",
    "phone": "51999887766"
  }')

if echo "$RESPONSE" | grep -q "letra maiúscula"; then
  echo -e "${GREEN}✅ PASSOU: Senha sem maiúscula rejeitada${NC}"
else
  echo -e "${RED}❌ FALHOU: Senha sem maiúscula aceita${NC}"
fi
echo ""

# 3. Testar XSS em Nome
echo "3️⃣  Testando sanitização XSS..."
echo -e "${YELLOW}⚠️  Requer token JWT válido (pule se não tiver)${NC}"
echo ""

# 4. Testar Rate Limit - Login
echo "4️⃣  Testando rate limit de login (5 tentativas)..."
echo "Fazendo 7 requisições rápidas..."

SUCCESS_COUNT=0
BLOCKED_COUNT=0

for i in {1..7}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}')
  
  if [ "$HTTP_CODE" = "429" ]; then
    ((BLOCKED_COUNT++))
  else
    ((SUCCESS_COUNT++))
  fi
  sleep 0.2
done

if [ $BLOCKED_COUNT -gt 0 ]; then
  echo -e "${GREEN}✅ PASSOU: Rate limit funcionando ($BLOCKED_COUNT bloqueadas de 7)${NC}"
else
  echo -e "${RED}❌ FALHOU: Rate limit não bloqueou nenhuma requisição${NC}"
fi
echo ""

# 5. Testar Validação de Email
echo "5️⃣  Testando validação de email..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-invalido",
    "password": "Senha123",
    "companyName": "Test",
    "phone": "51999887766"
  }')

if echo "$RESPONSE" | grep -q "Email inválido"; then
  echo -e "${GREEN}✅ PASSOU: Email inválido rejeitado${NC}"
else
  echo -e "${RED}❌ FALHOU: Email inválido aceito${NC}"
fi
echo ""

# 6. Testar Validação de Telefone
echo "6️⃣  Testando validação de telefone..."
RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@test.com",
    "password": "Senha123",
    "companyName": "Test",
    "phone": "123"
  }')

if echo "$RESPONSE" | grep -q "Telefone inválido"; then
  echo -e "${GREEN}✅ PASSOU: Telefone inválido rejeitado${NC}"
else
  echo -e "${RED}❌ FALHOU: Telefone inválido aceito${NC}"
fi
echo ""

# 7. Testar Headers de Segurança
echo "7️⃣  Testando security headers (Helmet)..."
HEADERS=$(curl -s -I "$API_URL/machines" | grep -i "x-")

if echo "$HEADERS" | grep -q "x-"; then
  echo -e "${GREEN}✅ PASSOU: Security headers presentes${NC}"
  echo "$HEADERS" | head -3
else
  echo -e "${YELLOW}⚠️  AVISO: Alguns headers podem estar faltando${NC}"
fi
echo ""

# 8. Testar CORS
echo "8️⃣  Testando CORS..."
CORS=$(curl -s -I "$API_URL/machines" | grep -i "access-control")

if echo "$CORS" | grep -q "access-control-allow-origin"; then
  echo -e "${GREEN}✅ PASSOU: CORS configurado${NC}"
else
  echo -e "${YELLOW}⚠️  AVISO: CORS pode não estar configurado${NC}"
fi
echo ""

# Resumo
echo "================================"
echo "✅ TESTES CONCLUÍDOS"
echo ""
echo "📝 Testes que requerem autenticação:"
echo "   - XSS em criação de máquinas"
echo "   - Ownership check"
echo "   - Ocultação de telefone"
echo ""
echo "Execute com token JWT para testes completos:"
echo "export JWT_TOKEN='seu-token-aqui'"
echo "./test-security.sh"
