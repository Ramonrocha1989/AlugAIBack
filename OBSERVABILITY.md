# 🔍 Observabilidade - Guia Completo

Sistema completo de monitoramento e observabilidade implementado com **Sentry** + **BetterStack** + **Health/Metrics**.

## 📊 O que foi implementado

### 1. **Health Checks** ✅
Endpoints para verificar status da aplicação:

- `GET /api/health` - Status completo (DB, memória, uptime)
- `GET /api/health/ready` - Readiness check (para Kubernetes/Docker)
- `GET /api/health/live` - Liveness check (servidor está vivo?)

### 2. **Metrics** 📈
Endpoint com métricas de negócio e sistema:

- `GET /api/metrics` - Métricas completas
  - Usuários (total, premium, conversão)
  - Máquinas (total, ativas, inativas)
  - Engajamento (propostas, favoritos, reviews)
  - Sistema (memória, uptime, versão Node)

### 3. **Sentry** 🐛
Error tracking automático:

- Captura erros 500+ automaticamente
- Stack traces completos
- Contexto do usuário e requisição
- Alertas por email
- Performance monitoring

### 4. **BetterStack Logs** 📝
Logs centralizados:

- Logs estruturados em JSON
- Dashboard profissional
- Busca rápida
- Alertas configuráveis

---

## 🚀 Setup Rápido (15 minutos)

### Passo 1: Instalar Dependências

```bash
npm install
```

### Passo 2: Configurar Sentry (5 min)

1. Acesse: https://sentry.io/signup/
2. Crie uma conta gratuita
3. Crie um projeto **Node.js**
4. Copie o **DSN** (algo como: `https://abc123@o123.ingest.sentry.io/456`)
5. Adicione no `.env`:

```env
SENTRY_DSN="https://abc123@o123.ingest.sentry.io/456"
SENTRY_ENVIRONMENT="production"
```

### Passo 3: Configurar BetterStack (5 min)

1. Acesse: https://betterstack.com/logs
2. Crie uma conta gratuita
3. Crie um **Source** (Node.js)
4. Copie o **Source Token**
5. Adicione no `.env`:

```env
BETTERSTACK_TOKEN="seu-token-aqui"
```

### Passo 4: Testar (5 min)

```bash
# Iniciar servidor
npm run start:dev

# Testar health check
curl http://localhost:3000/api/health

# Testar metrics
curl http://localhost:3000/api/metrics

# Forçar um erro para testar Sentry
# (acesse qualquer rota que não existe)
curl http://localhost:3000/api/teste-erro
```

---

## 📖 Como Usar

### Health Checks

```bash
# Status completo
curl http://localhost:3000/api/health

# Resposta:
{
  "status": "healthy",
  "timestamp": "2024-02-20T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "5ms"
    },
    "memory": {
      "status": "healthy",
      "heapUsed": "45MB",
      "heapTotal": "100MB",
      "usage": "45.00%"
    },
    "uptime": {
      "status": "healthy",
      "uptime": "5m 30s",
      "uptimeSeconds": 330
    }
  }
}
```

### Metrics

```bash
curl http://localhost:3000/api/metrics

# Resposta:
{
  "timestamp": "2024-02-20T10:30:00.000Z",
  "system": {
    "uptime": 330,
    "uptimeFormatted": "0h 5m",
    "memory": {
      "heapUsed": 45,
      "heapTotal": 100,
      "rss": 120,
      "external": 5
    },
    "nodeVersion": "v20.11.0",
    "platform": "darwin"
  },
  "business": {
    "users": {
      "total": 150,
      "premium": 30,
      "free": 120,
      "conversionRate": "20.00%"
    },
    "machines": {
      "total": 500,
      "active": 450,
      "inactive": 50
    },
    "engagement": {
      "proposals": 200,
      "favorites": 300,
      "reviews": 100
    }
  }
}
```

### Logs no Código

```typescript
import { LoggerService } from './common/logger.service';

export class PaymentService {
  constructor(private logger: LoggerService) {}

  async processPayment(userId: string, amount: number) {
    try {
      this.logger.log(`Processing payment for user ${userId}`, 'PaymentService');
      
      // ... lógica de pagamento
      
      this.logger.log(`Payment successful: ${amount}`, 'PaymentService');
    } catch (error) {
      this.logger.error(
        `Payment failed for user ${userId}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }
}
```

### Ver Logs

**Console (Desenvolvimento):**
```bash
npm run start:dev
# Logs aparecem coloridos no terminal
```

**BetterStack (Produção):**
1. Acesse: https://logs.betterstack.com
2. Veja todos os logs em tempo real
3. Use filtros: `level:error`, `context:PaymentService`
4. Configure alertas

**Sentry (Erros):**
1. Acesse: https://sentry.io/seu-projeto
2. Veja todos os erros com stack traces
3. Filtre por usuário, endpoint, etc
4. Configure alertas por email/Slack

---

## 🎯 Monitoramento em Produção

### 1. **Uptime Monitoring**

Use um serviço gratuito como:
- **UptimeRobot** (https://uptimerobot.com) - Grátis
- **Pingdom** - Grátis até 50 checks

Configure para monitorar:
```
https://seu-dominio.com/api/health/live
```

Se retornar status 200, está tudo ok.

### 2. **Alertas Automáticos**

**Sentry:**
- Configurar alertas por email quando houver erros
- Integrar com Slack para notificações em tempo real

**BetterStack:**
- Criar alertas para logs com `level:error`
- Notificar quando houver picos de erros

### 3. **Dashboard**

Crie um dashboard simples com:
- Grafana (grátis)
- Metabase (grátis)
- Ou use o próprio BetterStack

Monitore:
- Taxa de conversão (free → premium)
- Número de máquinas ativas
- Propostas por dia
- Erros por hora

---

## 💰 Custos

| Serviço | Plano Gratuito | Quando Pagar |
|---------|----------------|--------------|
| **Sentry** | 5.000 erros/mês | $26/mês (50k erros) |
| **BetterStack** | 1GB logs/mês | $10/mês (5GB) |
| **Health/Metrics** | Grátis sempre | - |

**Estimativa:**
- MVP (0-100 usuários): **R$ 0/mês**
- Crescimento (100-1000): **R$ 50-100/mês**
- Escala (1000+): **R$ 200-500/mês**

---

## 🔧 Troubleshooting

### Sentry não está capturando erros

1. Verifique se `SENTRY_DSN` está no `.env`
2. Verifique se o erro é 500+ (erros 400 não são capturados)
3. Teste forçando um erro:

```typescript
throw new Error('Teste Sentry');
```

### BetterStack não está recebendo logs

1. Verifique se `BETTERSTACK_TOKEN` está no `.env`
2. Verifique a conexão com internet
3. Logs aparecem com ~30s de delay

### Health check retorna "degraded"

1. Verifique conexão com banco de dados
2. Verifique uso de memória (>90% = warning)
3. Veja detalhes em `/api/health`

---

## 📚 Próximos Passos

1. ✅ **Configurar alertas** no Sentry e BetterStack
2. ✅ **Integrar com Slack** para notificações
3. ✅ **Criar dashboard** com métricas de negócio
4. ✅ **Configurar uptime monitoring** (UptimeRobot)
5. ✅ **Documentar runbooks** para incidentes comuns

---

## 🆘 Suporte

- **Sentry Docs:** https://docs.sentry.io/platforms/node/
- **BetterStack Docs:** https://betterstack.com/docs/logs/
- **Health Checks:** Padrão Kubernetes (https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

---

## ✅ Checklist de Produção

Antes de ir para produção, verifique:

- [ ] Sentry configurado e testado
- [ ] BetterStack configurado e testado
- [ ] Health checks funcionando
- [ ] Metrics endpoint funcionando
- [ ] Alertas configurados
- [ ] Uptime monitoring ativo
- [ ] Logs estruturados em todas as operações críticas
- [ ] Try/catch em operações de pagamento
- [ ] Variáveis de ambiente em produção configuradas

---

**Pronto! Seu backend agora tem observabilidade profissional.** 🎉
