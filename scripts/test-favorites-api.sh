#!/bin/bash

# Script de teste para API de Favoritos
# Uso: ./test-favorites-api.sh

BASE_URL="http://localhost:3000/api"

echo "🧪 Testando API de Favoritos"
echo "=============================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Login
echo -e "${YELLOW}1. Fazendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Erro no login. Verifique as credenciais.${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 2. Listar máquinas disponíveis
echo -e "${YELLOW}2. Listando máquinas disponíveis...${NC}"
MACHINES=$(curl -s "$BASE_URL/machines?limit=5")
MACHINE_ID=$(echo $MACHINES | jq -r '.data[0].id')

if [ "$MACHINE_ID" == "null" ] || [ -z "$MACHINE_ID" ]; then
  echo -e "${RED}❌ Nenhuma máquina encontrada. Crie uma máquina primeiro.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Máquinas encontradas${NC}"
echo "Primeira máquina ID: $MACHINE_ID"
echo ""

# 3. Adicionar aos favoritos
echo -e "${YELLOW}3. Adicionando máquina aos favoritos...${NC}"
ADD_RESPONSE=$(curl -s -X POST "$BASE_URL/favorites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"machineId\":\"$MACHINE_ID\"}")

FAVORITE_ID=$(echo $ADD_RESPONSE | jq -r '.id')

if [ "$FAVORITE_ID" == "null" ] || [ -z "$FAVORITE_ID" ]; then
  echo -e "${RED}❌ Erro ao adicionar favorito${NC}"
  echo "Response: $ADD_RESPONSE"
else
  echo -e "${GREEN}✅ Favorito adicionado com sucesso${NC}"
  echo "Favorite ID: $FAVORITE_ID"
fi
echo ""

# 4. Verificar se está favoritado
echo -e "${YELLOW}4. Verificando se máquina está favoritada...${NC}"
CHECK_RESPONSE=$(curl -s "$BASE_URL/favorites/check/$MACHINE_ID" \
  -H "Authorization: Bearer $TOKEN")

IS_FAVORITED=$(echo $CHECK_RESPONSE | jq -r '.isFavorited')

if [ "$IS_FAVORITED" == "true" ]; then
  echo -e "${GREEN}✅ Máquina está nos favoritos${NC}"
else
  echo -e "${RED}❌ Máquina NÃO está nos favoritos${NC}"
fi
echo ""

# 5. Listar favoritos
echo -e "${YELLOW}5. Listando todos os favoritos...${NC}"
FAVORITES_LIST=$(curl -s "$BASE_URL/favorites" \
  -H "Authorization: Bearer $TOKEN")

FAVORITES_COUNT=$(echo $FAVORITES_LIST | jq '. | length')

echo -e "${GREEN}✅ Total de favoritos: $FAVORITES_COUNT${NC}"
echo "Favoritos:"
echo $FAVORITES_LIST | jq -r '.[] | "  - \(.machine.name) (\(.machine.manufacturer))"'
echo ""

# 6. Tentar adicionar novamente (deve dar erro 409)
echo -e "${YELLOW}6. Tentando adicionar novamente (deve falhar)...${NC}"
DUPLICATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/favorites" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"machineId\":\"$MACHINE_ID\"}")

HTTP_CODE=$(echo "$DUPLICATE_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "409" ]; then
  echo -e "${GREEN}✅ Erro 409 retornado corretamente (duplicata)${NC}"
else
  echo -e "${RED}❌ Código HTTP esperado: 409, recebido: $HTTP_CODE${NC}"
fi
echo ""

# 7. Remover dos favoritos
echo -e "${YELLOW}7. Removendo máquina dos favoritos...${NC}"
REMOVE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/favorites/$MACHINE_ID" \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✅ Favorito removido${NC}"
echo "Response: $REMOVE_RESPONSE"
echo ""

# 8. Verificar se foi removido
echo -e "${YELLOW}8. Verificando se foi removido...${NC}"
CHECK_AFTER_REMOVE=$(curl -s "$BASE_URL/favorites/check/$MACHINE_ID" \
  -H "Authorization: Bearer $TOKEN")

IS_FAVORITED_AFTER=$(echo $CHECK_AFTER_REMOVE | jq -r '.isFavorited')

if [ "$IS_FAVORITED_AFTER" == "false" ]; then
  echo -e "${GREEN}✅ Máquina removida dos favoritos com sucesso${NC}"
else
  echo -e "${RED}❌ Máquina ainda está nos favoritos${NC}"
fi
echo ""

# 9. Listar favoritos novamente
echo -e "${YELLOW}9. Listando favoritos após remoção...${NC}"
FAVORITES_AFTER=$(curl -s "$BASE_URL/favorites" \
  -H "Authorization: Bearer $TOKEN")

FAVORITES_COUNT_AFTER=$(echo $FAVORITES_AFTER | jq '. | length')

echo -e "${GREEN}✅ Total de favoritos: $FAVORITES_COUNT_AFTER${NC}"
echo ""

echo "=============================="
echo -e "${GREEN}🎉 Testes concluídos!${NC}"
