# ⚡ Guia Rápido - Sistema de Planos

## 🚀 Início Rápido (3 comandos)

```bash
# 1. Iniciar servidor
npm run start:dev

# 2. Testar endpoint de planos
curl http://localhost:3000/api/plans

# 3. Executar suite de testes
./test-plans-api.sh
```

---

## 📋 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar em modo desenvolvimento
npm run start:dev

# Build para produção
npm run build

# Executar produção
npm run start:prod
```

### Banco de Dados
```bash
# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate

# Abrir Prisma Studio
npx prisma studio
```

### Testes
```bash
# Testar sistema de planos
./test-plans-api.sh

# Testar endpoint específico
curl http://localhost:3000/api/plans
curl http://localhost:3000/api/equipments -H "Authorization: Bearer TOKEN"
```

---

## 🔍 Endpoints Principais

### Listar Planos (Público)
```bash
curl http://localhost:3000/api/plans
```

### Criar Equipamento (com validação)
```bash
curl -X POST http://localhost:3000/api/equipments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trator",
    "description": "Descrição",
    "dailyPrice": 300,
    "location": "São Paulo"
  }'
```

### Listar Equipamentos (ordenados)
```bash
curl http://localhost:3000/api/equipments \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ver Detalhes (incrementa views)
```bash
curl http://localhost:3000/api/equipments/EQUIPMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Rastrear WhatsApp
```bash
curl -X POST http://localhost:3000/api/equipments/EQUIPMENT_ID/track-whatsapp \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Marcar Lead
```bash
curl -X POST http://localhost:3000/api/equipments/EQUIPMENT_ID/mark-lead \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Verificar Status

### Verificar se servidor está rodando
```bash
curl http://localhost:3000/api/plans
```

### Verificar banco de dados
```bash
npx prisma studio
```

### Ver logs
```bash
# Logs do servidor
tail -f logs/app.log

# Ou ver no terminal onde o servidor está rodando
```

---

## 🔧 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
npx prisma generate
```

### Erro: "Database connection failed"
```bash
# Verificar se PostgreSQL está rodando
pg_isready

# Verificar variáveis de ambiente
cat .env
```

### Erro: "Migration failed"
```bash
# Resetar banco (CUIDADO: apaga dados)
npx prisma migrate reset

# Ou aplicar migrations manualmente
npx prisma migrate deploy
```

### Erro: "Port 3000 already in use"
```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou mudar porta no .env
PORT=3001
```

---

## 📁 Arquivos Importantes

### Documentação
```bash
# Documentação completa da API
cat PLANS_API.md

# Guia de integração frontend
cat FRONTEND_INTEGRATION.md

# Resumo da implementação
cat START_HERE_PLANS.md

# Changelog
cat CHANGELOG_PLANS.md
```

### Código
```bash
# Ver schema do banco
cat prisma/schema.prisma

# Ver service de planos
cat src/modules/plans/plans.service.ts

# Ver controller de equipments
cat src/modules/equipments/equipments.controller.ts
```

---

## 🧪 Testes Rápidos

### Teste 1: Listar planos
```bash
curl http://localhost:3000/api/plans | jq '.'
```

### Teste 2: Criar usuário e testar limite
```bash
# 1. Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@example.com",
    "password": "senha123",
    "companyName": "Empresa Teste",
    "companyDocument": "12345678901234"
  }'

# 2. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }' | jq -r '.access_token')

# 3. Criar 3 anúncios (deve funcionar)
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/equipments \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Equipamento $i\",
      \"description\": \"Descrição $i\",
      \"dailyPrice\": 300,
      \"location\": \"São Paulo\"
    }"
done

# 4. Tentar criar 4º (deve falhar)
curl -X POST http://localhost:3000/api/equipments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Equipamento 4",
    "description": "Descrição 4",
    "dailyPrice": 300,
    "location": "São Paulo"
  }'
```

---

## 📚 Links Úteis

- **Swagger**: http://localhost:3000/api/docs
- **Prisma Studio**: http://localhost:5555 (após `npx prisma studio`)
- **Documentação NestJS**: https://docs.nestjs.com
- **Documentação Prisma**: https://www.prisma.io/docs

---

## ✅ Checklist de Verificação

Antes de considerar pronto:

- [ ] Servidor inicia sem erros
- [ ] Endpoint `/api/plans` retorna 2 planos
- [ ] Criar 3 anúncios funciona (Free)
- [ ] Criar 4º anúncio falha com erro 403
- [ ] Views incrementam ao visualizar
- [ ] Tracking de WhatsApp funciona
- [ ] Tracking de leads funciona
- [ ] Ordenação por plano está correta
- [ ] Swagger está acessível
- [ ] Testes automatizados passam

---

## 🎯 Comandos Mais Usados

```bash
# Top 5 comandos que você vai usar:

1. npm run start:dev              # Iniciar servidor
2. ./test-plans-api.sh            # Testar tudo
3. curl http://localhost:3000/api/plans  # Testar planos
4. npx prisma studio              # Ver banco de dados
5. cat PLANS_API.md               # Ver documentação
```

---

## 💡 Dicas

1. **Sempre use `jq` para formatar JSON**:
   ```bash
   curl http://localhost:3000/api/plans | jq '.'
   ```

2. **Salve o token em variável**:
   ```bash
   TOKEN="seu_token_aqui"
   curl -H "Authorization: Bearer $TOKEN" ...
   ```

3. **Use Prisma Studio para debug**:
   ```bash
   npx prisma studio
   ```

4. **Veja logs em tempo real**:
   ```bash
   npm run start:dev | grep -i error
   ```

5. **Teste com usuários diferentes**:
   - Crie um usuário Free (padrão)
   - Teste limite de 3 anúncios
   - Mude manualmente para Lojista no banco
   - Teste anúncios ilimitados

---

**Pronto para usar! 🚀**
