# 🚀 Setup Rápido - Observabilidade (15 minutos)

## ✅ O que foi implementado

- ✅ Health checks (`/api/health`, `/api/health/ready`, `/api/health/live`)
- ✅ Metrics endpoint (`/api/metrics`)
- ✅ Sentry (error tracking)
- ✅ BetterStack (logs centralizados)
- ✅ Logger service estruturado

## 📦 Passo 1: Dependências (já instaladas)

```bash
npm install
```

## 🔧 Passo 2: Configurar Sentry (5 min)

### 2.1. Criar conta gratuita
1. Acesse: https://sentry.io/signup/
2. Clique em "Sign up"
3. Use email ou GitHub

### 2.2. Criar projeto
1. Clique em "Create Project"
2. Escolha plataforma: **Node.js**
3. Nome do projeto: `equipment-rental-api`
4. Clique em "Create Project"

### 2.3. Copiar DSN
1. Você verá uma tela com código
2. Copie o **DSN** (algo como: `https://abc123@o123.ingest.sentry.io/456`)
3. Adicione no `.env`:

```env
SENTRY_DSN="https://abc123@o123.ingest.sentry.io/456"
SENTRY_ENVIRONMENT="production"
```

## 📝 Passo 3: Configurar BetterStack (5 min)

### 3.1. Criar conta gratuita
1. Acesse: https://betterstack.com/logs
2. Clique em "Start free trial"
3. Use email ou GitHub

### 3.2. Criar Source
1. No dashboard, clique em "Add source"
2. Escolha: **Node.js**
3. Nome: `equipment-rental-api`
4. Clique em "Create source"

### 3.3. Copiar Token
1. Você verá o **Source Token**
2. Copie o token
3. Adicione no `.env`:

```env
BETTERSTACK_TOKEN="seu-token-aqui"
```

## 🧪 Passo 4: Testar (5 min)

### 4.1. Iniciar servidor
```bash
npm run start:dev
```

Você deve ver:
```
✅ Sentry initialized
🚀 Application is running on: http://localhost:3000
🏥 Health check: http://localhost:3000/api/health
📊 Metrics: http://localhost:3000/api/metrics
🔍 Sentry: Error tracking enabled
📝 BetterStack: Logs enabled
```

### 4.2. Testar endpoints
```bash
# Rodar script de teste
./test-observability.sh

# Ou manualmente:
curl http://localhost:3000/api/health
curl http://localhost:3000/api/metrics
```

### 4.3. Testar Sentry
Acesse uma rota que não existe para forçar um erro:
```bash
curl http://localhost:3000/api/teste-erro-404
```

Depois acesse: https://sentry.io/seu-projeto
Você deve ver o erro capturado!

### 4.4. Testar BetterStack
Os logs aparecem automaticamente. Acesse:
https://logs.betterstack.com

Você verá todos os logs em tempo real!

## 🎯 Passo 5: Configurar Alertas (Opcional)

### Sentry
1. Acesse: https://sentry.io/seu-projeto/settings/alerts/
2. Clique em "Create Alert"
3. Configure: "Enviar email quando houver erro"

### BetterStack
1. Acesse: https://logs.betterstack.com/team/alerts
2. Clique em "Create Alert"
3. Configure: "Alertar quando level:error"

## ✅ Checklist

- [ ] Sentry DSN configurado no `.env`
- [ ] BetterStack token configurado no `.env`
- [ ] Servidor iniciado com sucesso
- [ ] Health check funcionando
- [ ] Metrics funcionando
- [ ] Erro apareceu no Sentry
- [ ] Logs apareceram no BetterStack

## 🆘 Problemas?

### Sentry não está capturando erros
- Verifique se o DSN está correto no `.env`
- Reinicie o servidor
- Teste com um erro 500 (não 404)

### BetterStack não está recebendo logs
- Verifique se o token está correto no `.env`
- Aguarde ~30 segundos (delay normal)
- Verifique conexão com internet

### Health check retorna erro
- Verifique se o banco de dados está rodando
- Verifique a `DATABASE_URL` no `.env`

## 📚 Próximos Passos

1. Leia a documentação completa: [OBSERVABILITY.md](./OBSERVABILITY.md)
2. Veja exemplos de uso: [src/common/logger.example.ts](./src/common/logger.example.ts)
3. Configure alertas no Sentry e BetterStack
4. Integre o logger nos seus services existentes

## 💰 Custos

- **Sentry:** Grátis até 5.000 erros/mês
- **BetterStack:** Grátis até 1GB logs/mês
- **Health/Metrics:** Grátis sempre

Suficiente para MVP e primeiros 100-500 usuários!

---

**Pronto! Seu backend agora tem observabilidade profissional.** 🎉

Qualquer dúvida, consulte: [OBSERVABILITY.md](./OBSERVABILITY.md)
