#!/bin/bash

# 🔒 Script de Teste de Segurança
# Testa todas as implementações de segurança do backend

BASE_URL="http://localhost:3000/api"
COOKIES_FILE="test-cookies.txt"

echo "🔒 TESTANDO IMPLEMENTAÇÕES DE SEGURANÇA"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar
test_endpoint() {
    local name=$1
    local expected=$2
    local result=$3
    
    if [[ $result == *"$expected"* ]]; then
        echo -e "${GREEN}✅ $name${NC}"
    else
        echo -e "${RED}❌ $name${NC}"
        echo "   Esperado: $expected"
        echo "   Recebido: $result"
    fi
}

# 1. Testar CSRF Token
echo "1️⃣  Testando CSRF Token..."
CSRF_RESPONSE=$(curl -s $BASE_URL/auth/csrf-token)
test_endpoint "CSRF Token disponível" "csrfToken" "$CSRF_RESPONSE"
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
echo "   Token: ${CSRF_TOKEN:0:20}..."
echo ""

# 2. Testar Login sem CSRF (deve falhar)
echo "2️⃣  Testando Login SEM CSRF Token (deve falhar)..."
LOGIN_NO_CSRF=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}' 2>&1)
HTTP_CODE=$(echo "$LOGIN_NO_CSRF" | tail -n1)
if [ "$HTTP_CODE" == "403" ]; then
    echo -e "${GREEN}✅ CSRF Protection funcionando (403 Forbidden)${NC}"
else
    echo -e "${RED}❌ CSRF Protection não está funcionando (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# 3. Testar Headers de Segurança
echo "3️⃣  Testando Security Headers (Helmet)..."
HEADERS=$(curl -s -I $BASE_URL/auth/csrf-token)
test_endpoint "Strict-Transport-Security (HSTS)" "Strict-Transport-Security" "$HEADERS"
test_endpoint "X-Content-Type-Options" "X-Content-Type-Options" "$HEADERS"
test_endpoint "X-Frame-Options" "X-Frame-Options" "$HEADERS"
echo ""

# 4. Testar CORS
echo "4️⃣  Testando CORS com Credentials..."
CORS_RESPONSE=$(curl -s -I -H "Origin: http://localhost:3001" $BASE_URL/auth/csrf-token)
test_endpoint "Access-Control-Allow-Credentials" "Access-Control-Allow-Credentials: true" "$CORS_RESPONSE"
test_endpoint "Access-Control-Allow-Origin" "Access-Control-Allow-Origin" "$CORS_RESPONSE"
echo ""

# 5. Testar Rate Limiting (Login)
echo "5️⃣  Testando Rate Limiting (5 tentativas)..."
echo "   Fazendo 6 tentativas de login..."
RATE_LIMIT_OK=true
for i in {1..6}; do
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
      -H "Content-Type: application/json" \
      -H "X-CSRF-Token: $CSRF_TOKEN" \
      -d '{"email":"test@example.com","password":"wrong"}' 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ $i -le 5 ]; then
        if [ "$HTTP_CODE" == "401" ]; then
            echo -e "   ${GREEN}✓${NC} Tentativa $i: 401 (esperado)"
        else
            echo -e "   ${RED}✗${NC} Tentativa $i: $HTTP_CODE (esperado 401)"
            RATE_LIMIT_OK=false
        fi
    else
        if [ "$HTTP_CODE" == "429" ]; then
            echo -e "   ${GREEN}✓${NC} Tentativa $i: 429 Too Many Requests (esperado)"
        else
            echo -e "   ${RED}✗${NC} Tentativa $i: $HTTP_CODE (esperado 429)"
            RATE_LIMIT_OK=false
        fi
    fi
    sleep 0.5
done

if [ "$RATE_LIMIT_OK" = true ]; then
    echo -e "${GREEN}✅ Rate Limiting funcionando corretamente${NC}"
else
    echo -e "${RED}❌ Rate Limiting com problemas${NC}"
fi
echo ""

# 6. Testar Validação Global
echo "6️⃣  Testando Validação Global (campos extras)..."
VALIDATION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"email":"test@example.com","password":"123456","extraField":"hack"}' 2>&1)
HTTP_CODE=$(echo "$VALIDATION_RESPONSE" | tail -n1)
BODY=$(echo "$VALIDATION_RESPONSE" | head -n -1)

if [[ "$BODY" == *"property extraField should not exist"* ]] || [ "$HTTP_CODE" == "400" ]; then
    echo -e "${GREEN}✅ Validação rejeitando campos extras${NC}"
else
    echo -e "${YELLOW}⚠️  Validação pode não estar rejeitando campos extras${NC}"
fi
echo ""

# 7. Resumo
echo "========================================"
echo "📊 RESUMO DOS TESTES"
echo "========================================"
echo ""
echo "✅ Implementações testadas:"
echo "   • CSRF Protection"
echo "   • Security Headers (Helmet + HSTS)"
echo "   • CORS com Credentials"
echo "   • Rate Limiting"
echo "   • Validação Global"
echo ""
echo "📝 Próximos passos:"
echo "   1. Testar login real com usuário válido"
echo "   2. Verificar cookies httpOnly no navegador"
echo "   3. Atualizar frontend para usar cookies"
echo ""
echo "🔗 Documentação completa: SECURITY_IMPLEMENTATION.md"
echo ""

# Limpar arquivo de cookies
rm -f $COOKIES_FILE

echo "✅ Testes concluídos!"
