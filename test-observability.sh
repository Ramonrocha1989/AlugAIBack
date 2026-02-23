#!/bin/bash

echo "🔍 Testando Observabilidade..."
echo ""

BASE_URL="http://localhost:3000/api"

echo "1️⃣ Health Check:"
curl -s "$BASE_URL/health" | jq '.'
echo ""

echo "2️⃣ Readiness Check:"
curl -s "$BASE_URL/health/ready" | jq '.'
echo ""

echo "3️⃣ Liveness Check:"
curl -s "$BASE_URL/health/live" | jq '.'
echo ""

echo "4️⃣ Metrics:"
curl -s "$BASE_URL/metrics" | jq '.'
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "📊 Próximos passos:"
echo "1. Configure Sentry: https://sentry.io/signup"
echo "2. Configure BetterStack: https://betterstack.com/logs"
echo "3. Adicione as variáveis no .env"
