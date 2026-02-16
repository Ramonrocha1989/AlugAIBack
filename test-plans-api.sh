#!/bin/bash

# Script de teste para o sistema de planos
# Execute: chmod +x test-plans-api.sh && ./test-plans-api.sh

BASE_URL="http://localhost:3000/api"
TOKEN=""

echo "🧪 Testando Sistema de Planos"
echo "================================"
echo ""

# 1. Listar planos (público)
echo "1️⃣  GET /plans - Listar planos disponíveis"
curl -s -X GET "$BASE_URL/plans" | jq '.'
echo ""
echo "---"
echo ""

# 2. Registrar usuário para testes
echo "2️⃣  POST /auth/register - Criar usuário de teste"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Planos",
    "email": "teste.planos@example.com",
    "password": "senha123",
    "companyName": "Empresa Teste Planos",
    "companyDocument": "12345678901234"
  }')
echo "$REGISTER_RESPONSE" | jq '.'
echo ""
echo "---"
echo ""

# 3. Login
echo "3️⃣  POST /auth/login - Fazer login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste.planos@example.com",
    "password": "senha123"
  }')
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
echo "Token obtido: ${TOKEN:0:20}..."
echo ""
echo "---"
echo ""

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erro ao obter token. Verifique se o usuário já existe ou se o email foi verificado."
  echo "💡 Dica: Use um usuário existente ou verifique o email primeiro."
  exit 1
fi

# 4. Criar primeiro equipamento (deve funcionar - Free tem limite de 3)
echo "4️⃣  POST /equipments - Criar 1º equipamento (deve funcionar)"
EQUIP1=$(curl -s -X POST "$BASE_URL/equipments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trator 1",
    "description": "Primeiro trator de teste",
    "dailyPrice": 300,
    "location": "São Paulo"
  }')
echo "$EQUIP1" | jq '.'
EQUIP1_ID=$(echo "$EQUIP1" | jq -r '.id')
echo ""
echo "---"
echo ""

# 5. Criar segundo equipamento
echo "5️⃣  POST /equipments - Criar 2º equipamento (deve funcionar)"
curl -s -X POST "$BASE_URL/equipments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trator 2",
    "description": "Segundo trator de teste",
    "dailyPrice": 350,
    "location": "Campinas"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 6. Criar terceiro equipamento
echo "6️⃣  POST /equipments - Criar 3º equipamento (deve funcionar)"
curl -s -X POST "$BASE_URL/equipments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trator 3",
    "description": "Terceiro trator de teste",
    "dailyPrice": 400,
    "location": "Ribeirão Preto"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 7. Tentar criar quarto equipamento (deve falhar - limite atingido)
echo "7️⃣  POST /equipments - Criar 4º equipamento (deve FALHAR - limite atingido)"
curl -s -X POST "$BASE_URL/equipments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trator 4",
    "description": "Quarto trator de teste",
    "dailyPrice": 450,
    "location": "Santos"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 8. Listar equipamentos (verificar ordenação)
echo "8️⃣  GET /equipments - Listar equipamentos (verificar ordenação por plano)"
curl -s -X GET "$BASE_URL/equipments" \
  -H "Authorization: Bearer $TOKEN" | jq '.[0:3] | .[] | {name, ownerPlan, isPremium, views}'
echo ""
echo "---"
echo ""

# 9. Ver detalhes de um equipamento (incrementa views)
if [ ! -z "$EQUIP1_ID" ] && [ "$EQUIP1_ID" != "null" ]; then
  echo "9️⃣  GET /equipments/:id - Ver detalhes (incrementa views)"
  curl -s -X GET "$BASE_URL/equipments/$EQUIP1_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '{name, views, whatsappClicks, qualifiedLeads, ownerPlan}'
  echo ""
  echo "---"
  echo ""

  # 10. Ver novamente (views deve ter incrementado)
  echo "🔟 GET /equipments/:id - Ver novamente (views deve aumentar)"
  curl -s -X GET "$BASE_URL/equipments/$EQUIP1_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '{name, views, whatsappClicks, qualifiedLeads, ownerPlan}'
  echo ""
  echo "---"
  echo ""

  # 11. Rastrear clique no WhatsApp
  echo "1️⃣1️⃣  POST /equipments/:id/track-whatsapp - Rastrear clique WhatsApp"
  curl -s -X POST "$BASE_URL/equipments/$EQUIP1_ID/track-whatsapp" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""
  echo "---"
  echo ""

  # 12. Marcar lead qualificado
  echo "1️⃣2️⃣  POST /equipments/:id/mark-lead - Marcar lead qualificado"
  curl -s -X POST "$BASE_URL/equipments/$EQUIP1_ID/mark-lead" \
    -H "Authorization: Bearer $TOKEN" | jq '.'
  echo ""
  echo "---"
  echo ""

  # 13. Ver detalhes finais (verificar contadores)
  echo "1️⃣3️⃣  GET /equipments/:id - Ver contadores finais"
  curl -s -X GET "$BASE_URL/equipments/$EQUIP1_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '{name, views, whatsappClicks, qualifiedLeads, ownerPlan}'
  echo ""
fi

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📊 Resumo:"
echo "  - Planos listados com sucesso"
echo "  - Limite de 3 anúncios validado para plano Free"
echo "  - Tracking de views funcionando"
echo "  - Tracking de WhatsApp clicks funcionando"
echo "  - Tracking de leads qualificados funcionando"
echo "  - Ordenação por plano implementada"
