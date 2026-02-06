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
```

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

### Empresas

- `GET /api/companies/me` - Dados da minha empresa

### Equipamentos

- `POST /api/equipments` - Criar equipamento
- `GET /api/equipments` - Listar equipamentos (com filtros)
- `GET /api/equipments/:id` - Detalhes do equipamento
- `PUT /api/equipments/:id` - Atualizar equipamento
- `DELETE /api/equipments/:id` - Deletar equipamento

### Aluguéis

- `POST /api/rentals` - Solicitar aluguel
- `GET /api/rentals/my` - Meus aluguéis (como locador ou locatário)
- `PUT /api/rentals/:id/approve` - Aprovar aluguel
- `PUT /api/rentals/:id/reject` - Rejeitar aluguel

### Admin

- `GET /api/admin/users` - Listar todos os usuários (ADMIN)
- `GET /api/admin/rentals` - Listar todos os aluguéis (ADMIN)

## Documentação Swagger

Acesse: `http://localhost:3000/api/docs`

## Modelo de Dados

### User
- Usuário do sistema
- Vinculado a uma empresa
- Roles: ADMIN | COMPANY

### Company
- Empresa cadastrada
- Pode ter múltiplos usuários
- Pode ter múltiplos equipamentos

### Equipment
- Equipamento disponível para aluguel
- Pertence a uma empresa
- Pode ter múltiplas imagens

### Rental
- Solicitação de aluguel
- Status: PENDING | APPROVED | REJECTED | COMPLETED
- Vincula equipamento e empresa locatária

### Payment (Mock)
- Pagamento simulado
- Status: PENDING | PAID | FAILED

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
- JWT para autenticação stateless
- Guards para proteção de rotas
- Validação de propriedade em operações sensíveis
- CORS configurado

## Próximos Passos (Pós-MVP)

- [ ] Integração com gateway de pagamento real
- [ ] Sistema de notificações
- [ ] Chat entre empresas
- [ ] Upload de imagens para S3
- [ ] Sistema de avaliações
- [ ] Relatórios e analytics
- [ ] Testes automatizados

## Scripts Disponíveis

```bash
npm run start:dev      # Desenvolvimento com hot-reload
npm run build          # Build para produção
npm run start:prod     # Executar produção
npm run prisma:migrate # Executar migrations
npm run prisma:studio  # Interface visual do banco
```

## Licença

MIT
