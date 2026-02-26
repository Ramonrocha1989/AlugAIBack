#!/bin/bash

echo "=== Testando Ordenação de Máquinas ==="
echo ""

BASE_URL="http://localhost:3000"

echo "1. Testando ordenação por data (recent - padrão)"
curl -s "$BASE_URL/machines?sortBy=recent&limit=5" | jq '.data[] | {id: .id, name: .name, createdAt: .createdAt, isPremium: .isPremium, isFeatured: .isFeatured, ownerPlan: .ownerPlan}'
echo ""

echo "2. Testando ordenação por preço crescente (price_asc)"
curl -s "$BASE_URL/machines?sortBy=price_asc&limit=5" | jq '.data[] | {id: .id, name: .name, price: .price, isPremium: .isPremium, isFeatured: .isFeatured}'
echo ""

echo "3. Testando ordenação por preço decrescente (price_desc)"
curl -s "$BASE_URL/machines?sortBy=price_desc&limit=5" | jq '.data[] | {id: .id, name: .name, price: .price, isPremium: .isPremium, isFeatured: .isFeatured}'
echo ""

echo "4. Testando ordenação por ano (year_desc)"
curl -s "$BASE_URL/machines?sortBy=year_desc&limit=5" | jq '.data[] | {id: .id, name: .name, yearModel: .yearModel, isPremium: .isPremium, isFeatured: .isFeatured}'
echo ""

echo "5. Testando ordenação por horas de motor (engine_hours_asc)"
curl -s "$BASE_URL/machines?sortBy=engine_hours_asc&limit=5" | jq '.data[] | {id: .id, name: .name, engineHours: .engineHours, isPremium: .isPremium, isFeatured: .isFeatured}'
echo ""

echo "=== Teste Completo ==="
