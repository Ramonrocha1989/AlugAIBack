# Testing & CI/CD

Sistema completo de testes automatizados e pipeline CI/CD implementado.

## 🧪 Testes Implementados

### Testes Unitários
- ✅ **AuthService** - Registro, login, verificação de email
- ✅ **MachinesService** - CRUD de máquinas, validações de plano

### Testes E2E
- ✅ **Auth endpoints** - /api/auth/register, /api/auth/login
- ✅ **Machines endpoints** - /api/machines (GET, POST)

## 🚀 Como Rodar os Testes

### Localmente

```bash
# Instalar dependências de teste
npm install

# Rodar testes unitários
npm test

# Rodar testes com watch mode
npm run test:watch

# Rodar testes com cobertura
npm run test:cov

# Rodar testes E2E
npm run test:e2e
```

### Configurar Banco de Teste

```bash
# Criar banco de teste
createdb equipment_rental_test

# Rodar migrations
DATABASE_URL="postgresql://user:password@localhost:5432/equipment_rental_test" npm run prisma:deploy
```

## 🔄 CI/CD Pipeline

### Fluxo Automático

```
git push → GitHub Actions → Testes → ✅ Deploy Railway
                                   → ❌ Bloqueia deploy
```

### O que o CI/CD faz:

1. **Checkout do código**
2. **Setup Node.js 20**
3. **Instala dependências** (npm ci)
4. **Gera Prisma Client**
5. **Roda migrations** (banco PostgreSQL temporário)
6. **Executa testes unitários**
7. **Executa testes E2E**
8. **Upload de cobertura** (Codecov)
9. **Deploy automático** (só se testes passarem)

### Branches Protegidas

- **main** - Produção (requer testes passando)
- **develop** - Staging (testes rodam mas não bloqueia)
- **feature/** - Development (testes rodam em PRs)

## 📊 Cobertura de Testes

Após rodar `npm run test:cov`, veja o relatório em:
```
coverage/lcov-report/index.html
```

## 🔧 Configuração GitHub

### 1. Proteger Branch Main

No GitHub:
1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. ✅ Require status checks to pass
4. ✅ Require branches to be up to date
5. Selecione: `Run Tests`

### 2. Configurar Railway

Railway já está configurado para:
- Auto-deploy da branch `main`
- Health check em `/api/health`
- Restart automático em caso de falha

## 📝 Adicionando Novos Testes

### Teste Unitário

```typescript
// src/modules/exemplo/exemplo.service.spec.ts
import { Test } from '@nestjs/testing';
import { ExemploService } from './exemplo.service';

describe('ExemploService', () => {
  let service: ExemploService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ExemploService],
    }).compile();

    service = module.get(ExemploService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Teste E2E

```typescript
// test/exemplo.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Exemplo (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/api/exemplo (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/exemplo')
      .expect(200);
  });
});
```

## 🎯 Próximos Passos

- [ ] Aumentar cobertura para 80%+
- [ ] Adicionar testes de integração (Proposals, Reviews)
- [ ] Configurar testes de performance
- [ ] Adicionar testes de segurança (OWASP)

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
- [GitHub Actions](https://docs.github.com/en/actions)
