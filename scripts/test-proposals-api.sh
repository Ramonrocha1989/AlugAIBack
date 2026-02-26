#!/bin/bash

# Script de teste para API de Propostas
# Certifique-se de ter um token JWT válido

BASE_URL="http://localhost:3000/api"
TOKEN="seu_token_aqui"

echo "🧪 Testando API de Propostas"
echo "================================"

# 1. Criar proposta
echo ""
echo "1️⃣ Criando proposta..."
curl -X POST "$BASE_URL/proposals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "uuid-da-maquina",
    "proposedPrice": 250000,
    "message": "Tenho interesse na máquina. Posso pagar à vista com esse valor."
  }' | jq

# 2. Listar propostas recebidas
echo ""
echo "2️⃣ Listando propostas recebidas..."
curl -X GET "$BASE_URL/proposals" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Listar propostas enviadas
echo ""
echo "3️⃣ Listando propostas enviadas..."
curl -X GET "$BASE_URL/proposals?type=sent" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Aceitar proposta
echo ""
echo "4️⃣ Aceitando proposta..."
curl -X PATCH "$BASE_URL/proposals/uuid-proposta/accept" \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Fazer contra-proposta
echo ""
echo "5️⃣ Fazendo contra-proposta..."
curl -X PATCH "$BASE_URL/proposals/uuid-proposta/counter" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "counterPrice": 270000,
    "counterMessage": "Posso aceitar por esse valor, mas precisa ser à vista."
  }' | jq

# 6. Recusar proposta
echo ""
echo "6️⃣ Recusando proposta..."
curl -X PATCH "$BASE_URL/proposals/uuid-proposta/reject" \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. Cancelar proposta
echo ""
echo "7️⃣ Cancelando proposta..."
curl -X DELETE "$BASE_URL/proposals/uuid-proposta" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "✅ Testes concluídos!"
