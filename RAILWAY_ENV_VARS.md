# 🚂 Variáveis de Ambiente - Railway (Produção)

## ✅ OBRIGATÓRIAS (Sem essas o app NÃO funciona)

```env
# 1. DATABASE_URL
# ⚠️ O Railway cria automaticamente quando você adiciona PostgreSQL
# Não precisa configurar manualmente
DATABASE_URL=postgresql://postgres:xxx@xxx.railway.app:5432/railway

# 2. JWT_SECRET
# Gere com: openssl rand -base64 64
JWT_SECRET=XK8vN2mP9qR5sT7uW1xY3zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA0b

# 3. JWT_EXPIRES_IN
JWT_EXPIRES_IN=7d

# 4. FRONTEND_URL
# URL do seu frontend em produção
FRONTEND_URL=https://mercadomaquina.online

# 5. RESEND_API_KEY
# Pegue em: https://resend.com/api-keys
RESEND_API_KEY=re_seu_token_aqui

# 6. MERCADOPAGO_ACCESS_TOKEN
# ⚠️ Use token de PRODUÇÃO (não TEST)
# Pegue em: https://www.mercadopago.com.br/developers/panel/credentials
MERCADOPAGO_ACCESS_TOKEN=PROD-seu_token_aqui

# 7. NODE_ENV
NODE_ENV=production
```

## 📊 OPCIONAIS (Recomendadas para monitoramento)

```env
# 8. SENTRY_DSN
# Para rastreamento de erros
# Pegue em: https://sentry.io
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# 9. SENTRY_ENVIRONMENT
SENTRY_ENVIRONMENT=production

# 10. BETTERSTACK_TOKEN
# Para logs centralizados
# Pegue em: https://betterstack.com
BETTERSTACK_TOKEN=seu_token_aqui
```

## 🎯 Resumo: Quantas variáveis?

**Mínimo para funcionar:** 7 variáveis obrigatórias
**Recomendado (com monitoramento):** 10 variáveis

## 📋 Checklist de Configuração no Railway

1. [ ] Criar projeto no Railway
2. [ ] Adicionar PostgreSQL (gera `DATABASE_URL` automaticamente)
3. [ ] Adicionar serviço do GitHub (seu repositório)
4. [ ] Configurar as 7 variáveis obrigatórias
5. [ ] (Opcional) Configurar as 3 variáveis de monitoramento
6. [ ] Fazer deploy

## 🔧 Como Adicionar no Railway

### Via Interface Web:
1. Acesse seu projeto no Railway
2. Clique no serviço (backend)
3. Vá em "Variables"
4. Clique em "New Variable"
5. Adicione uma por uma

### Via Railway CLI (mais rápido):
```bash
# Instale o CLI
npm i -g @railway/cli

# Faça login
railway login

# Link ao projeto
railway link

# Adicione as variáveis
railway variables set JWT_SECRET="seu_valor_aqui"
railway variables set FRONTEND_URL="https://mercadomaquina.online"
railway variables set RESEND_API_KEY="re_xxx"
railway variables set MERCADOPAGO_ACCESS_TOKEN="PROD-xxx"
railway variables set NODE_ENV="production"
railway variables set SENTRY_DSN="https://xxx"
railway variables set SENTRY_ENVIRONMENT="production"
railway variables set BETTERSTACK_TOKEN="xxx"
```

## ⚠️ IMPORTANTE

### NÃO precisa configurar no Railway:
- ❌ `POSTGRES_USER` (só para Docker local)
- ❌ `POSTGRES_PASSWORD` (só para Docker local)
- ❌ `POSTGRES_DB` (só para Docker local)
- ❌ `PORT` (Railway define automaticamente)

### Valores diferentes em DEV vs PROD:

| Variável | Desenvolvimento | Produção |
|----------|----------------|----------|
| `FRONTEND_URL` | `http://localhost:3001` | `https://mercadomaquina.online` |
| `MERCADOPAGO_ACCESS_TOKEN` | `TEST-xxx` | `PROD-xxx` |
| `NODE_ENV` | `development` | `production` |
| `SENTRY_ENVIRONMENT` | `development` | `production` |

## 🧪 Testar se está tudo certo

Após configurar, teste:

```bash
# 1. Health check
curl https://seu-app.railway.app/api/health

# 2. Deve retornar:
{
  "status": "ok",
  "database": "connected",
  "uptime": 123,
  "memory": {...}
}
```

## 🆘 Troubleshooting

### Erro: "JWT_SECRET must be at least 32 characters"
```bash
# Gere um novo:
openssl rand -base64 64
```

### Erro: "DATABASE_URL must be a valid URL"
- Verifique se o PostgreSQL está adicionado no Railway
- A variável é criada automaticamente

### Erro: "RESEND_API_KEY must start with 're_'"
- Verifique se copiou o token correto do Resend
- Deve começar com `re_`

### Erro: "Cannot connect to database"
- Verifique se o PostgreSQL está rodando no Railway
- Verifique se `DATABASE_URL` está configurada
