#!/bin/bash

# 🚜 Script de Teste - API de Máquinas Agrícolas

BASE_URL="http://localhost:3000/api"

echo "🚀 Testando API de Máquinas..."
echo ""

# 1. Testar listagem (público)
echo "1️⃣ Testando GET /machines (público)"
curl -s "$BASE_URL/machines" | jq '.'
echo ""

# 2. Testar filtros
echo "2️⃣ Testando filtros - Tratores no RS"
curl -s "$BASE_URL/machines?category=TRACTORS&state=RS" | jq '.'
echo ""

# 3. Testar busca por horas de motor
echo "3️⃣ Testando filtro de horas de motor (max 5000h)"
curl -s "$BASE_URL/machines?maxEngineHours=5000" | jq '.'
echo ""

# 4. Testar paginação
echo "4️⃣ Testando paginação (página 1, 10 itens)"
curl -s "$BASE_URL/machines?page=1&limit=10" | jq '.meta'
echo ""

echo "✅ Testes básicos concluídos!"
echo ""
echo "📝 Para criar uma máquina, você precisa:"
echo "   1. Fazer login: POST /auth/login"
echo "   2. Usar o token: POST /machines com Authorization: Bearer {token}"
echo ""
echo "📚 Documentação completa: MACHINES_API.md"
