# 🔒 Checklist de Segurança para Produção

## ✅ Antes de Deploy em Produção

### 1. Gerar JWT_SECRET Forte (OBRIGATÓRIO)

```bash
# Execute no terminal:
openssl rand -base64 64
```

**Copie o resultado e use no Railway como variável de ambiente `JWT_SECRET`**

### 2. Variáveis de Ambiente no Railway

Configure estas variáveis no painel do Railway:

```env
# OBRIGATÓRIAS
DATABASE_URL=<fornecido_automaticamente_pelo_railway>
JWT_SECRET=<valor_gerado_com_openssl_acima>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://mercadomaquina.online
RESEND_API_KEY=re_<seu_token_de_producao>
MERCADOPAGO_ACCESS_TOKEN=PROD-<seu_token_de_producao>
NODE_ENV=production

# OPCIONAIS (Recomendadas)
SENTRY_DSN=<seu_dsn_do_sentry>
SENTRY_ENVIRONMENT=production
BETTERSTACK_TOKEN=<seu_token_do_betterstack>
```

### 3. Verificar CORS

No arquivo `src/main.ts`, confirme os domínios permitidos:

```typescript
origin: [
  'https://mercadomaquina.online',
  'https://www.mercadomaquina.online',
  // Remova domínios de teste/desenvolvimento
]
```

### 4. Mercado Pago - Token de Produção

⚠️ **IMPORTANTE**: Troque o token TEST por PROD

1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Copie o **Access Token de PRODUÇÃO**
3. Configure no Railway: `MERCADOPAGO_ACCESS_TOKEN=PROD-xxxxx`

### 5. Backup do Banco de Dados

No Railway:
1. Vá em Database > Settings
2. Ative "Automated Backups"
3. Configure retenção (mínimo 7 dias)

### 6. Monitoramento e Alertas

#### Sentry (Error Tracking)
- Configure alertas para erros 5xx
- Configure alertas para taxa de erro > 1%

#### BetterStack (Logs)
- Configure alertas para logs ERROR
- Configure alertas para logs CRITICAL

#### Uptime Monitor (Opcional)
- Use UptimeRobot (grátis): https://uptimerobot.com
- Monitore: `https://seu-dominio.railway.app/api/health`

## 🚨 Nunca Faça Isso

- ❌ Commitar arquivo `.env` no Git
- ❌ Expor JWT_SECRET no código
- ❌ Usar senhas fracas (< 32 caracteres)
- ❌ Usar token TEST do Mercado Pago em produção
- ❌ Desabilitar CORS em produção
- ❌ Desabilitar rate limiting

## ✅ Checklist Final

Antes de fazer deploy, confirme:

- [ ] JWT_SECRET gerado com openssl (64+ caracteres)
- [ ] Todas as variáveis configuradas no Railway
- [ ] Token PROD do Mercado Pago configurado
- [ ] CORS configurado apenas com domínios de produção
- [ ] Backup automático ativado no Railway
- [ ] Sentry configurado e testado
- [ ] BetterStack configurado e testado
- [ ] Health check funcionando: `/api/health`
- [ ] Swagger desabilitado ou protegido (opcional)

## 🔐 Rotação de Secrets (Recomendado)

A cada 90 dias, gere novos secrets:

```bash
# Novo JWT_SECRET
openssl rand -base64 64

# Atualize no Railway
# Faça deploy gradual (blue-green) se possível
```

## 📞 Em Caso de Incidente

1. Revogue tokens comprometidos imediatamente
2. Gere novos secrets
3. Force logout de todos os usuários (limpar refresh tokens)
4. Investigue logs no BetterStack
5. Verifique erros no Sentry
6. Notifique usuários se necessário (LGPD)

## 📚 Documentação Adicional

- [SECURITY.md](./SECURITY.md) - Implementação de segurança
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Setup de monitoramento
- [README.md](./README.md) - Documentação geral
