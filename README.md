# BaitaBriq API (Backend)

API B2B para compra, venda e negociacao de maquinas entre empresas.

## Stack

- Node.js + TypeScript
- NestJS
- Prisma + PostgreSQL
- JWT (access token + refresh token em cookie)
- Zod + class-validator
- Swagger
- Docker
- Sentry + BetterStack
- Cloudinary
- Mercado Pago

## Estrutura

```txt
src/
├── common/              # Infra compartilhada (guards, interceptors, prisma, logger)
├── config/              # Validacao e configuracao de ambiente
├── modules/
│   ├── auth/            # Login, cadastro, refresh, perfil e exclusao de conta
│   ├── users/           # Perfil do usuario
│   ├── companies/       # Perfil da empresa e maquinas da empresa
│   ├── machines/        # CRUD e metricas de anuncios
│   ├── proposals/       # Fluxo de propostas
│   ├── favorites/       # Favoritos
│   ├── reviews/         # Avaliacoes
│   ├── notifications/   # Notificacoes
│   ├── plans/           # Planos publicos
│   ├── subscriptions/   # Acoes de assinatura
│   ├── verification/    # Solicitacao de verificacao
│   ├── analytics/       # Resumos e benchmarks
│   ├── categories/      # Categorias publicas
│   ├── settings/        # Configuracoes publicas
│   ├── admin/           # Painel administrativo
│   ├── health/          # Health/readiness/liveness
│   ├── metrics/         # Metricas protegidas
│   ├── webhooks/        # Webhooks Mercado Pago
│   └── images/          # Remocao de imagem no Cloudinary
├── app.module.ts
└── main.ts
```

## Setup local

1. Instale dependencias:

```bash
npm install
```

2. Configure ambiente:

```bash
cp .env.example .env
```

3. Rode migrations e client do Prisma:

```bash
npm run prisma:migrate
npm run prisma:generate
```

4. Suba a API:

```bash
npm run start:dev
```

Swagger (dev): `http://localhost:3000/api/docs`

## Endpoints principais

Prefixo global: `/api`

### Auth

- `GET /auth/health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email`
- `GET /auth/me`
- `PUT /auth/profile`
- `POST /auth/upgrade-plan` (admin)
- `POST /auth/request-delete`
- `POST /auth/confirm-delete`

### Users

- `GET /users/me`
- `PUT /users/me`

### Companies

- `GET /companies/me`
- `PUT /companies/profile`
- `GET /companies/:id`
- `GET /companies/:id/machines`

### Machines

- `POST /machines`
- `GET /machines`
- `GET /machines/my`
- `GET /machines/:id`
- `POST /machines/:id/view`
- `POST /machines/:id/track-whatsapp`
- `POST /machines/:id/mark-lead`
- `PUT /machines/:id`
- `DELETE /machines/:id`

### Proposals

- `POST /proposals`
- `GET /proposals`
- `PATCH /proposals/:id/accept`
- `PATCH /proposals/:id/reject`
- `PATCH /proposals/:id/counter`
- `PATCH /proposals/:id/view`
- `DELETE /proposals/:id`

### Favorites

- `POST /favorites`
- `GET /favorites`
- `GET /favorites/check/:machineId`
- `DELETE /favorites/:machineId`

### Reviews

- `POST /reviews`
- `GET /reviews/user/:userId`
- `GET /reviews/user/:userId/rating`
- `GET /reviews/machine/:machineId`
- `PUT /reviews/:id`
- `DELETE /reviews/:id`

### Notifications

- `GET /notifications`
- `GET /notifications/unread-count`
- `PUT /notifications/:id/read`
- `PUT /notifications/read-all`
- `DELETE /notifications/:id`

### Planos, assinatura e verificacao

- `GET /plans`
- `POST /subscriptions/cancel`
- `POST /verification/request`

### Analytics, catalogo e configuracao publica

- `GET /analytics/summary`
- `GET /analytics/category-benchmarks?category=...`
- `GET /categories`
- `GET /settings/public`

### Admin

- `GET /admin/stats`
- `GET /admin/users`
- `PATCH /admin/users/:id/ban`
- `PATCH /admin/users/:id/verify`
- `PATCH /admin/users/:id/plan`
- `GET /admin/machines`
- `PATCH /admin/machines/:id/status`
- `PATCH /admin/machines/:id/feature`
- `DELETE /admin/machines/:id`
- `GET /admin/reviews`
- `DELETE /admin/reviews/:id`
- `GET /admin/settings`
- `POST /admin/settings`
- `POST /admin/banners`
- `DELETE /admin/banners/:id`
- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories/:id`
- `DELETE /admin/categories/:id`
- `PATCH /admin/categories/:id/order`
- `GET /admin/plans`
- `PUT /admin/plans/:id`
- `GET /admin/verification-requests`
- `POST /admin/verification-requests/:id/approve`
- `POST /admin/verification-requests/:id/reject`

### Observabilidade e webhooks

- `GET /health` (admin)
- `GET /health/ready` (publico)
- `GET /health/live` (publico)
- `GET /metrics` (admin)
- `POST /webhooks/mercadopago` (publico)
- `GET /webhooks/mercadopago` (publico)
- `POST /images/delete`

## Scripts uteis

```bash
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run test:e2e
npm run test:cov
npm run prisma:migrate
npm run prisma:studio
```
