# Equipment Rental Marketplace - Backend API

Marketplace B2B para aluguel de equipamentos entre empresas.

## Stack Tecnológica

- **Node.js** + **TypeScript**
- **NestJS** - Framework backend
- **Prisma** - ORM
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Zod** - Validação de dados
- **Swagger** - Documentação de API
- **Docker** - Containerização
- **Sentry** - Error tracking
- **BetterStack** - Logs centralizados
- **Cloudinary** - Upload de imagens
- **Mercado Pago** - Gateway de pagamento

## Arquitetura

### Estrutura de Pastas

```
src/
├── common/                    # Código compartilhado
│   ├── pipes/                 # Pipes de validação (Zod)
│   └── prisma.service.ts      # Serviço Prisma
├── modules/                   # Módulos da aplicação
│   ├── auth/                  # Autenticação e autorização
│   │   ├── decorators/        # Decorators customizados
│   │   ├── dto/               # DTOs de autenticação
│   │   ├── guards/            # Guards (JWT, Roles)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── jwt.strategy.ts
│   ├── companies/             # Gestão de empresas
│   ├── equipments/            # Gestão de equipamentos
│   ├── rentals/               # Gestão de aluguéis
│   └── admin/                 # Endpoints administrativos
├── app.module.ts              # Módulo raiz
└── main.ts                    # Entry point
```

### Princípios Arquiteturais

1. **Separação de Responsabilidades**
   - Controllers: Recebem requisições e retornam respostas
   - Services: Contêm lógica de negócio
   - Repositories: Acesso a dados via Prisma

2. **Multi-tenant Ready**
   - Todas as operações são isoladas por companyId
   - Validação de propriedade em updates/deletes

3. **Validação com Zod**
   - Schemas tipados e reutilizáveis
   - Validação em tempo de execução
   - Mensagens de erro claras

4. **Autenticação JWT**
   - Token com informações do usuário
   - Guards para proteção de rotas
   - Decorators para controle de acesso

## Instalação

### Pré-requisitos

- Node.js 20+
- PostgreSQL 16+
- Docker (opcional)

### Setup Local

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/equipment_rental?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000

# Frontend URL
FRONTEND_URL="http://localhost:3001"

# Resend API Key
RESEND_API_KEY="re_your_api_key_here"
```

**Nota**: Para configurar o email com Resend, veja [EMAIL_SETUP.md](./EMAIL_SETUP.md)

4. Execute as migrations:

```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Inicie o servidor:

```bash
npm run start:dev
```

### Setup com Docker

```bash
docker-compose up -d
```

## Endpoints da API

### Autenticação

- `POST /api/auth/register` - Cadastro de empresa e usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verificar email com token
- `POST /api/auth/forgot-password` - Solicitar recuperação de senha
- `POST /api/auth/reset-password` - Resetar senha com token
- `POST /api/auth/request-delete` - Solicitar exclusão de conta
- `POST /api/auth/confirm-delete` - Confirmar exclusão com token

### Empresas

- `GET /api/companies/me` - Dados da minha empresa

### Planos

- `GET /api/plans` - Listar planos disponíveis (Free e Lojista)

### Equipamentos

- `POST /api/equipments` - Criar equipamento (valida limite de anúncios)
- `GET /api/equipments` - Listar equipamentos (ordenados por plano)
- `GET /api/equipments/:id` - Detalhes do equipamento (incrementa views)
- `PUT /api/equipments/:id` - Atualizar equipamento
- `DELETE /api/equipments/:id` - Deletar equipamento
- `POST /api/equipments/:id/track-whatsapp` - Rastrear clique no WhatsApp
- `POST /api/equipments/:id/mark-lead` - Marcar lead qualificado

### Aluguéis

- `POST /api/rentals` - Solicitar aluguel
- `GET /api/rentals/my` - Meus aluguéis (como locador ou locatário)
- `PUT /api/rentals/:id/approve` - Aprovar aluguel
- `PUT /api/rentals/:id/reject` - Rejeitar aluguel

### Admin

- `GET /api/admin/users` - Listar todos os usuários (ADMIN)
- `GET /api/admin/rentals` - Listar todos os aluguéis (ADMIN)

### Observabilidade

- `GET /api/health` - Health check completo (DB, memória, uptime)
- `GET /api/health/ready` - Readiness check (Kubernetes)
- `GET /api/health/live` - Liveness check
- `GET /api/metrics` - Métricas de negócio e sistema

## Documentação Swagger

Acesse: `http://localhost:3000/api/docs`

## Modelo de Dados

### User
- Usuário do sistema
- Vinculado a uma empresa
- Roles: ADMIN | COMPANY
- Requer verificação de email para login
- **plan**: Plano do usuário ('free' ou 'lojista')
- **maxAds**: Limite de anúncios ativos (3 para free, ilimitado para lojista)

### Company
- Empresa cadastrada
- Pode ter múltiplos usuários
- Pode ter múltiplos equipamentos

### Equipment
- Equipamento disponível para aluguel
- Pertence a uma empresa
- Pode ter múltiplas imagens
- **isPremium**: Se o anúncio é premium
- **views**: Contador de visualizações
- **whatsappClicks**: Contador de cliques no WhatsApp
- **qualifiedLeads**: Contador de leads qualificados

### Rental
- Solicitação de aluguel
- Status: PENDING | APPROVED | REJECTED | COMPLETED
- Vincula equipamento e empresa locatária

### Payment (Mock)
- Pagamento simulado
- Status: PENDING | PAID | FAILED

### PasswordResetToken
- Token para recuperação de senha
- Expira em 1 hora
- Uso único

### EmailVerificationToken
- Token para verificação de email
- Expira em 24 horas
- Uso único

### DeleteToken
- Token para confirmação de exclusão de conta
- Expira em 24 horas
- Uso único
- Soft delete com período de graça de 30 dias

## Integração com Front-end (Next.js + React Query)

### Exemplo de uso com React Query

```typescript
// Login
const loginMutation = useMutation({
  mutationFn: async (data: LoginDto) => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
});

// Listar equipamentos
const { data: equipments } = useQuery({
  queryKey: ['equipments'],
  queryFn: async () => {
    const response = await fetch('http://localhost:3000/api/equipments', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
});
```

## Segurança

- Senhas hasheadas com bcrypt
- JWT em cookies httpOnly (proteção XSS)
- CSRF protection com tokens únicos
- Rate limiting (5 tentativas de login a cada 15min)
- Guards para proteção de rotas
- Validação de propriedade em operações sensíveis
- CORS configurado com credentials
- Tokens de uso único com expiração
- Helmet com HSTS habilitado
- Validação global com whitelist
- Security headers (CSP, X-Frame-Options, etc)
- **Proteção de dados sensíveis (LGPD/GDPR compliant)**

### Endpoints de Segurança

- `GET /api/auth/csrf-token` - Obter token CSRF
- `POST /api/auth/logout` - Logout com limpeza de cookie
- `GET /api/auth/me` - Perfil completo (incluindo dados sensíveis)

**Documentação completa:**
- [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md)
- [SENSITIVE_DATA_PROTECTION.md](./SENSITIVE_DATA_PROTECTION.md) - Proteção LGPD/GDPR

## Observabilidade

Sistema completo de monitoramento e observabilidade implementado:

- ✅ **Health Checks** - Endpoints para verificar status da aplicação
- ✅ **Metrics** - Métricas de negócio e sistema em tempo real
- ✅ **Sentry** - Error tracking automático com stack traces
- ✅ **BetterStack** - Logs centralizados com dashboard profissional
- ✅ **Logger Service** - Logs estruturados em JSON

**Setup rápido (15 min):**
1. Configure Sentry: https://sentry.io/signup (5k erros/mês grátis)
2. Configure BetterStack: https://betterstack.com/logs (1GB logs/mês grátis)
3. Adicione as variáveis no `.env`
4. Teste: `./test-observability.sh`

**Documentação completa:**
- [OBSERVABILITY_SETUP.md](./OBSERVABILITY_SETUP.md) - Setup rápido
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Guia completo

## Testes Automatizados

Sistema completo de testes implementado:

- ✅ **Testes Unitários** - AuthService, MachinesService
- ✅ **Testes E2E** - Auth endpoints, Machines endpoints
- ✅ **CI/CD Pipeline** - GitHub Actions + Railway
- ✅ **Cobertura de Código** - Jest coverage reports

**Rodar testes:**
```bash
./run-tests.sh          # Todos os testes
npm test                # Testes unitários
npm run test:e2e        # Testes E2E
npm run test:cov        # Com cobertura
```

**Documentação completa:** [TESTING.md](./TESTING.md)

## Próximos Passos (Pós-MVP)

- [x] ~~Integração com gateway de pagamento real~~ (Mercado Pago implementado)
- [x] ~~Upload de imagens~~ (Cloudinary implementado)
- [x] ~~Sistema de notificações~~ (Implementado)
- [x] ~~Sistema de avaliações~~ (Implementado)
- [x] ~~Observabilidade~~ (Sentry + BetterStack implementado)
- [x] ~~Testes automatizados~~ (Jest + CI/CD implementado)
- [ ] Chat entre empresas
- [ ] Relatórios e analytics avançados

## Scripts Disponíveis

```bash
npm run start:dev      # Desenvolvimento com hot-reload
npm run build          # Build para produção
npm run start:prod     # Executar produção
npm run test           # Testes unitários
npm run test:e2e       # Testes E2E
npm run test:cov       # Testes com cobertura
npm run prisma:migrate # Executar migrations
npm run prisma:studio  # Interface visual do banco
```

## Licença

MIT
