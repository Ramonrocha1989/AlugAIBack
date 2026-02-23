# 🚀 Guia Rápido: Testes + CI/CD

## ✅ O que foi implementado

### Testes
- ✅ Testes unitários (AuthService, MachinesService)
- ✅ Testes E2E (Auth, Machines endpoints)
- ✅ Configuração Jest completa
- ✅ Script de teste automatizado

### CI/CD
- ✅ GitHub Actions pipeline
- ✅ Testes automáticos em PRs
- ✅ Deploy bloqueado se testes falharem
- ✅ Integração com Railway

## 🧪 Como Usar

### 1. Rodar Testes Localmente

```bash
# Todos os testes
./run-tests.sh

# Apenas unitários
npm test

# Apenas E2E
npm run test:e2e

# Com cobertura
npm run test:cov
```

### 2. Fluxo de Desenvolvimento

```bash
# 1. Criar feature branch
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver e testar localmente
npm test

# 3. Commit e push
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade

# 4. Criar Pull Request no GitHub
# GitHub Actions vai rodar os testes automaticamente

# 5. Se testes passarem ✅
git checkout main
git merge feature/nova-funcionalidade
git push origin main

# 6. Railway faz deploy automático 🚀
```

## 🔧 Configurar GitHub (Primeira Vez)

### Proteger Branch Main

1. Vá para: **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Marque:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Selecione: `Run Tests`
5. Salve

Agora ninguém pode fazer merge na main sem os testes passarem!

## 📊 Ver Resultados

### Localmente
```bash
# Após rodar npm run test:cov
open coverage/lcov-report/index.html
```

### GitHub
- Vá para **Actions** tab
- Veja todos os testes rodando em tempo real
- ✅ Verde = passou
- ❌ Vermelho = falhou

### Railway
- Deploy só acontece se testes passarem
- Health check em `/api/health`
- Logs disponíveis no dashboard

## 🎯 Exemplo de Uso Real

### Cenário: Adicionar novo endpoint

```bash
# 1. Criar branch
git checkout -b feature/novo-endpoint

# 2. Criar o código
# src/modules/exemplo/exemplo.service.ts

# 3. Criar o teste
# src/modules/exemplo/exemplo.service.spec.ts

# 4. Rodar testes localmente
npm test

# 5. Se passou, commitar
git add .
git commit -m "feat: adiciona novo endpoint"
git push

# 6. Criar PR no GitHub
# Testes rodam automaticamente

# 7. Merge se passou
# Deploy automático no Railway
```

## 🚨 Se os Testes Falharem

### Localmente
```bash
# Ver detalhes do erro
npm test -- --verbose

# Rodar teste específico
npm test -- auth.service.spec.ts
```

### No GitHub Actions
1. Vá para **Actions** tab
2. Clique no workflow que falhou
3. Veja os logs detalhados
4. Corrija o código
5. Push novamente

## 📝 Adicionar Novos Testes

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

  it('should do something', () => {
    expect(service.doSomething()).toBe(true);
  });
});
```

### Teste E2E
```typescript
// test/exemplo.e2e-spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Exemplo (e2e)', () => {
  let app;

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

## 🎉 Pronto!

Agora você tem:
- ✅ Testes automatizados
- ✅ CI/CD funcionando
- ✅ Deploy seguro (só com testes passando)
- ✅ Proteção da branch main

**Próximo passo:** Aumentar cobertura de testes para 80%+
