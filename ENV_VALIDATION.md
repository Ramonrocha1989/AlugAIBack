# Environment Variables Validation

## ✅ Implementado

Sistema de validação automática de variáveis de ambiente usando Zod.

## 🎯 O que faz

- ✅ Valida todas as variáveis obrigatórias na inicialização
- ✅ Verifica formato correto (URLs, comprimento mínimo, etc)
- ✅ Define valores padrão para variáveis opcionais
- ✅ Falha rápido se algo estiver errado
- ✅ Mostra mensagens de erro claras

## 📋 Variáveis Obrigatórias

### Database
- `DATABASE_URL` - URL de conexão PostgreSQL (formato: postgresql://...)

### JWT
- `JWT_SECRET` - Secret para tokens JWT (mínimo 32 caracteres)
- `JWT_EXPIRES_IN` - Tempo de expiração (padrão: "7d")

### App
- `PORT` - Porta do servidor (padrão: 3000)
- `NODE_ENV` - Ambiente (development/production/test)

### Frontend
- `FRONTEND_URL` - URL do frontend para CORS

### Email
- `RESEND_API_KEY` - API key do Resend (formato: re_...)

### Payment
- `MERCADOPAGO_ACCESS_TOKEN` - Token do Mercado Pago

## 🔧 Variáveis Opcionais

### Observability
- `SENTRY_DSN` - URL do Sentry para error tracking
- `SENTRY_ENVIRONMENT` - Ambiente do Sentry
- `BETTERSTACK_TOKEN` - Token do BetterStack para logs

## 🚀 Como Funciona

### Desenvolvimento Local

```bash
# 1. Copie o .env.example
cp .env.example .env

# 2. Edite com seus valores reais
nano .env

# 3. Inicie o servidor
npm run start:dev

# Se faltar alguma variável:
❌ Invalid environment variables:
  • JWT_SECRET: JWT_SECRET must be at least 32 characters for security
  • RESEND_API_KEY: RESEND_API_KEY must start with "re_"

💡 Check your .env file or Railway environment variables
📖 See .env.example for reference
```

### Produção (Railway)

```bash
# 1. Configure as variáveis no Railway Dashboard
# 2. Faça deploy

# Se faltar alguma variável:
# Deploy FALHA com mensagem clara
# Você adiciona a variável
# Deploy novamente
```

## 🧪 Testando a Validação

### Teste 1: Remover variável obrigatória
```bash
# Remova JWT_SECRET do .env
npm run start:dev

# Resultado esperado:
❌ Invalid environment variables:
  • JWT_SECRET: Required
```

### Teste 2: Formato inválido
```bash
# Coloque um JWT_SECRET muito curto
JWT_SECRET="123"

npm run start:dev

# Resultado esperado:
❌ Invalid environment variables:
  • JWT_SECRET: JWT_SECRET must be at least 32 characters for security
```

### Teste 3: Tudo correto
```bash
# Com todas as variáveis corretas
npm run start:dev

# Resultado esperado:
✅ Environment variables validated successfully
🚀 Application is running on: http://localhost:3000
```

## 📁 Arquivos Criados

```
src/
├── config/
│   └── env.validation.ts    # Schema Zod + função de validação
└── main.ts                   # Modificado para chamar validateEnv()
```

## 🔒 Segurança

- ✅ Não loga valores de secrets
- ✅ Valida formato de JWT_SECRET (mínimo 32 caracteres)
- ✅ Valida formato de URLs
- ✅ Valida formato de API keys

## 💡 Benefícios

1. **Fail Fast** - Descobre erros antes de iniciar
2. **Documentação** - Schema serve como documentação
3. **Type Safety** - TypeScript sabe os tipos das variáveis
4. **Prevenção** - Evita bugs em produção
5. **Clareza** - Mensagens de erro claras

## 🎓 Exemplo de Uso no Código

```typescript
// Antes (sem validação)
const jwtSecret = process.env.JWT_SECRET; // string | undefined

// Depois (com validação)
import { validateEnv } from './config/env.validation';

const env = validateEnv();
const jwtSecret = env.JWT_SECRET; // string (garantido)
```

## 📚 Referências

- [Zod Documentation](https://zod.dev)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [12 Factor App - Config](https://12factor.net/config)
