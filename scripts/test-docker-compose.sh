#!/bin/bash

echo "🧪 Testando Docker Compose..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Parar containers antigos
echo "🛑 Parando containers antigos..."
docker-compose down
echo ""

# 2. Subir containers
echo "🚀 Subindo containers..."
docker-compose up -d
echo ""

# 3. Aguardar 10 segundos
echo "⏳ Aguardando 10 segundos para o app inicializar..."
sleep 10
echo ""

# 4. Verificar se os containers estão rodando
echo "📦 Verificando containers..."
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers estão rodando${NC}"
else
    echo -e "${RED}❌ Containers não estão rodando${NC}"
    docker-compose logs api
    exit 1
fi
echo ""

# 5. Testar health check
echo "🏥 Testando health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passou${NC}"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Health check falhou${NC}"
    echo "$HEALTH_RESPONSE"
    docker-compose logs api
    exit 1
fi
echo ""

# 6. Verificar variáveis de ambiente
echo "🔐 Verificando variáveis de ambiente..."
JWT_SECRET=$(docker-compose exec -T api env | grep JWT_SECRET)
if [ -n "$JWT_SECRET" ]; then
    echo -e "${GREEN}✅ JWT_SECRET está configurado${NC}"
else
    echo -e "${RED}❌ JWT_SECRET não encontrado${NC}"
    exit 1
fi
echo ""

# 7. Testar conexão com banco
echo "🗄️  Testando conexão com banco..."
DB_TEST=$(docker-compose exec -T postgres psql -U postgres -d equipment_rental -c "SELECT 1;" 2>&1)
if echo "$DB_TEST" | grep -q "1 row"; then
    echo -e "${GREEN}✅ Banco de dados está acessível${NC}"
else
    echo -e "${RED}❌ Erro ao conectar no banco${NC}"
    echo "$DB_TEST"
    exit 1
fi
echo ""

# 8. Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Acesse a documentação: http://localhost:3000/api/docs"
echo "🏥 Health check: http://localhost:3000/api/health"
echo "📊 Métricas: http://localhost:3000/api/metrics"
echo ""
echo "Para ver os logs:"
echo "  docker-compose logs -f api"
echo ""
echo "Para parar:"
echo "  docker-compose down"
