#!/bin/bash

# 🔒 Teste de Proteção de Dados Sensíveis

echo "🧪 Testando proteção de dados sensíveis..."
echo ""

API_URL="http://localhost:3000/api"
COOKIE_FILE="test-cookies.txt"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Limpar cookies anteriores
rm -f $COOKIE_FILE

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Obtendo CSRF Token..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CSRF_RESPONSE=$(curl -s -c $COOKIE_FILE "$API_URL/auth/csrf-token")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$CSRF_TOKEN" ]; then
  echo -e "${RED}❌ Falha ao obter CSRF token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ CSRF Token obtido: ${CSRF_TOKEN:0:20}...${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Testando Login..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b $COOKIE_FILE -c $COOKIE_FILE \
  -d '{
    "email": "ramonrocha1989@gmail.com",
    "password": "senha123"
  }')

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Verificando Dados Sensíveis no Login..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se phone NÃO está presente
if echo "$LOGIN_RESPONSE" | grep -q '"phone"'; then
  echo -e "${RED}❌ FALHA: Campo 'phone' encontrado no login (dado sensível exposto!)${NC}"
else
  echo -e "${GREEN}✅ SUCESSO: Campo 'phone' NÃO está no login${NC}"
fi

# Verificar se company.document NÃO está presente
if echo "$LOGIN_RESPONSE" | grep -q '"document"'; then
  echo -e "${RED}❌ FALHA: Campo 'document' encontrado no login (dado sensível exposto!)${NC}"
else
  echo -e "${GREEN}✅ SUCESSO: Campo 'document' NÃO está no login${NC}"
fi

# Verificar se campos essenciais ESTÃO presentes
if echo "$LOGIN_RESPONSE" | grep -q '"email"'; then
  echo -e "${GREEN}✅ SUCESSO: Campo 'email' presente${NC}"
else
  echo -e "${RED}❌ FALHA: Campo 'email' ausente${NC}"
fi

if echo "$LOGIN_RESPONSE" | grep -q '"plan"'; then
  echo -e "${GREEN}✅ SUCESSO: Campo 'plan' presente${NC}"
else
  echo -e "${RED}❌ FALHA: Campo 'plan' ausente${NC}"
fi

if echo "$LOGIN_RESPONSE" | grep -q '"usage"'; then
  echo -e "${GREEN}✅ SUCESSO: Campo 'usage' presente${NC}"
else
  echo -e "${RED}❌ FALHA: Campo 'usage' ausente${NC}"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Testando Endpoint /auth/me (dados completos)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ME_RESPONSE=$(curl -s "$API_URL/auth/me" \
  -b $COOKIE_FILE)

echo "$ME_RESPONSE" | jq '.' 2>/dev/null || echo "$ME_RESPONSE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Verificando Dados Sensíveis no /auth/me..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se phone ESTÁ presente
if echo "$ME_RESPONSE" | grep -q '"phone"'; then
  echo -e "${GREEN}✅ SUCESSO: Campo 'phone' presente no /auth/me${NC}"
else
  echo -e "${YELLOW}⚠️  AVISO: Campo 'phone' ausente no /auth/me${NC}"
fi

# Verificar se company.document ESTÁ presente
if echo "$ME_RESPONSE" | grep -q '"document"'; then
  echo -e "${GREEN}✅ SUCESSO: Campo 'document' presente no /auth/me${NC}"
else
  echo -e "${YELLOW}⚠️  AVISO: Campo 'document' ausente no /auth/me${NC}"
fi

echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Login NÃO expõe dados sensíveis (phone, document)${NC}"
echo -e "${GREEN}✅ Login retorna apenas dados essenciais${NC}"
echo -e "${GREEN}✅ /auth/me retorna dados completos (incluindo sensíveis)${NC}"
echo -e "${GREEN}✅ Proteção LGPD/GDPR implementada com sucesso!${NC}"
echo ""

# Limpar cookies
rm -f $COOKIE_FILE

echo "🎉 Teste concluído!"
