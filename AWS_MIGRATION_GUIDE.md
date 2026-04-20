# Guia de Migração para AWS

Documento de referência para migração do backend BaitaBriq de Railway para AWS.
Criado para ser executado quando o projeto escalar.

---

## Visão Geral

### Stack Atual → AWS

| Atual | AWS | Esforço |
|-------|-----|---------|
| Railway (compute) | AWS App Runner | Médio |
| PostgreSQL (Railway) | Amazon RDS PostgreSQL | Baixo |
| Variáveis de ambiente | AWS Parameter Store | Baixo |
| Docker images (Railway) | Amazon ECR | Baixo |
| CI/CD (GitHub Actions → Railway) | GitHub Actions → ECR → App Runner | Médio |
| Resend (email) | Amazon SES (opcional) | Baixo |
| Cloudinary (imagens) | Amazon S3 + CloudFront (opcional) | Médio |
| Sentry (errors) | Manter ou AWS X-Ray | Opcional |
| BetterStack (logs) | Manter ou CloudWatch Logs | Opcional |
| DNS/SSL externo | Route 53 + ACM | Baixo |

### O que NÃO muda no código

- NestJS, Prisma, JWT, Zod — tudo funciona igual
- Dockerfile — compatível com App Runner sem alteração
- Health checks (`/api/health/live`, `/api/health/ready`) — já prontos
- Graceful shutdown — já implementado
- Helmet, CORS, rate limiting, throttler — continuam
- Mercado Pago — independente de infra
- Validação de env (`env.validation.ts`) — só adicionar novas variáveis se necessário

---

## Passo a Passo

### 1. Criar Conta e Configurar IAM

- Criar conta AWS (se não tiver)
- Criar um usuário IAM para CI/CD com permissões:
  - `AmazonEC2ContainerRegistryFullAccess`
  - `AWSAppRunnerFullAccess`
  - `AmazonSSMReadOnlyAccess` (Parameter Store)
- Gerar Access Key para o GitHub Actions
- Guardar as credenciais como secrets no GitHub:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION` (usar `sa-east-1` para São Paulo)

### 2. Amazon RDS — Banco de Dados

**Console AWS → RDS → Create Database**

- Engine: PostgreSQL 16
- Template: Free Tier (ou Production quando escalar)
- Instance: `db.t4g.micro` (Free Tier) ou `db.t4g.small`
- Storage: 20GB gp3
- VPC: Default (anotar a VPC e subnets)
- Public access: No (App Runner acessa via VPC Connector)
- Database name: `equipment_rental`
- Habilitar backup automático (7 dias)

**Após criação:**

```
DATABASE_URL="postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/equipment_rental?schema=public&connection_limit=10&pool_timeout=10&connect_timeout=5"
```

**Rodar migrations:**

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 3. Amazon ECR — Registry de Imagens

```bash
# Criar repositório
aws ecr create-repository --repository-name baitabriq-api --region sa-east-1

# Login no ECR
aws ecr get-login-password --region sa-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.sa-east-1.amazonaws.com

# Build e push
docker build -t baitabriq-api .
docker tag baitabriq-api:latest <ACCOUNT_ID>.dkr.ecr.sa-east-1.amazonaws.com/baitabriq-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.sa-east-1.amazonaws.com/baitabriq-api:latest
```

### 4. AWS Parameter Store — Secrets

**Console AWS → Systems Manager → Parameter Store**

Criar cada variável como `SecureString`:

| Nome | Valor |
|------|-------|
| `/baitabriq/prod/DATABASE_URL` | Connection string do RDS |
| `/baitabriq/prod/JWT_SECRET` | Chave JWT (min 32 chars) |
| `/baitabriq/prod/JWT_EXPIRES_IN` | `7d` |
| `/baitabriq/prod/FRONTEND_URL` | `https://baitabriq.com.br` |
| `/baitabriq/prod/RESEND_API_KEY` | Chave do Resend |
| `/baitabriq/prod/MERCADOPAGO_ACCESS_TOKEN` | Token Mercado Pago PROD |
| `/baitabriq/prod/MERCADOPAGO_WEBHOOK_SECRET` | Webhook secret |
| `/baitabriq/prod/ENCRYPTION_KEY` | Chave de 64 chars hex |
| `/baitabriq/prod/SENTRY_DSN` | DSN do Sentry |
| `/baitabriq/prod/BETTERSTACK_TOKEN` | Token BetterStack |
| `/baitabriq/prod/NODE_ENV` | `production` |
| `/baitabriq/prod/PORT` | `3000` |

### 5. AWS App Runner — Deploy

**Console AWS → App Runner → Create Service**

- Source: Container registry → Amazon ECR
- Image URI: `<ACCOUNT_ID>.dkr.ecr.sa-east-1.amazonaws.com/baitabriq-api:latest`
- Port: `3000`
- CPU: 0.25 vCPU (escalar depois)
- Memory: 0.5 GB (escalar depois)
- Health check path: `/api/health/live`
- Auto scaling: Min 1, Max 3 (ajustar conforme demanda)

**VPC Connector (obrigatório para acessar o RDS):**

- Console AWS → App Runner → VPC Connectors → Create
- Selecionar a mesma VPC e subnets do RDS
- Security group: criar um que permita saída na porta 5432
- Associar o VPC Connector ao serviço App Runner

**Security Groups:**

- SG do RDS: permitir entrada na porta `5432` vindo do SG do App Runner
- SG do App Runner VPC Connector: permitir saída na porta `5432`

### 6. Route 53 + ACM — DNS e SSL

**Certificado SSL (ACM):**

- Console AWS → ACM → Request Certificate
- Domain: `api.baitabriq.com.br` (ou o subdomínio que usar)
- Validação por DNS
- App Runner associa o certificado automaticamente

**DNS (Route 53):**

- Criar Hosted Zone para `baitabriq.com.br`
- Atualizar nameservers no registrador do domínio
- Criar registro CNAME apontando para o endpoint do App Runner

### 7. CI/CD — GitHub Actions Atualizado

Substituir o job `deploy` no `.github/workflows/ci.yml`:

```yaml
deploy:
  name: Deploy to AWS
  needs: test
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'

  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: sa-east-1

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build, tag, and push image to ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: baitabriq-api
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

    - name: Deploy to App Runner
      run: |
        aws apprunner update-service \
          --service-arn ${{ secrets.APP_RUNNER_SERVICE_ARN }} \
          --source-configuration '{"ImageRepository":{"ImageIdentifier":"${{ steps.login-ecr.outputs.registry }}/baitabriq-api:${{ github.sha }}","ImageRepositoryType":"ECR"}}'
```

**Secrets necessários no GitHub:**

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `APP_RUNNER_SERVICE_ARN`

### 8. Atualizar CORS

No `main.ts`, adicionar o novo domínio do App Runner (ou custom domain) ao `allowedOrigins` se necessário.

---

## Migrações Opcionais

### Email: Resend → Amazon SES

Mais barato ($0.10/1000 emails vs Resend pricing).

Mudança necessária no `email.service.ts`:

```typescript
// Trocar:
import { Resend } from 'resend';
// Por:
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Inicializar:
private ses = new SESClient({ region: 'sa-east-1' });

// Enviar:
await this.ses.send(new SendEmailCommand({
  Source: 'BaitaBriq <noreply@baitabriq.com.br>',
  Destination: { ToAddresses: [email] },
  Message: {
    Subject: { Data: subject },
    Body: { Html: { Data: html } },
  },
}));
```

**Pré-requisitos SES:**

- Verificar domínio `baitabriq.com.br` no SES
- Solicitar saída do sandbox (para enviar para qualquer email)
- Dependência: `npm install @aws-sdk/client-ses`

### Imagens: Cloudinary → S3 + CloudFront

- Criar bucket S3: `baitabriq-images`
- Criar distribuição CloudFront apontando pro bucket
- Criar módulo de upload usando `@aws-sdk/client-s3`
- Dependência: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

### Observabilidade: Sentry/BetterStack → AWS Nativo

- App Runner já envia logs para CloudWatch automaticamente
- AWS X-Ray para tracing distribuído
- CloudWatch Alarms para alertas

---

## Estimativa de Custo Mensal

| Serviço | Config | Custo Estimado |
|---------|--------|----------------|
| App Runner | 0.25 vCPU, 0.5GB | $5-15/mês |
| RDS PostgreSQL | db.t4g.micro | $0 (Free Tier) → $15/mês |
| ECR | ~1GB imagens | ~$1/mês |
| Parameter Store | Standard | Grátis |
| Route 53 | 1 hosted zone | $0.50/mês |
| ACM | Certificado SSL | Grátis |
| SES (se migrar) | Baixo volume | ~$1/mês |
| **Total MVP** | | **~$20-35/mês** |

Use o [AWS Pricing Calculator](https://calculator.aws) para estimativas precisas.

---

## Checklist de Migração

- [ ] Conta AWS criada e IAM configurado
- [ ] RDS PostgreSQL provisionado
- [ ] Migrations executadas no RDS
- [ ] Repositório ECR criado
- [ ] Imagem Docker pushed para ECR
- [ ] Parameter Store configurado com todas as variáveis
- [ ] App Runner criado com VPC Connector
- [ ] Security Groups configurados (App Runner ↔ RDS)
- [ ] Health check funcionando (`/api/health/live`)
- [ ] Route 53 + ACM configurados
- [ ] CI/CD atualizado para deploy na AWS
- [ ] CORS atualizado com novo domínio
- [ ] Testar todos os endpoints
- [ ] Testar envio de emails
- [ ] Testar webhook do Mercado Pago
- [ ] Monitorar logs no CloudWatch
- [ ] Desligar Railway após validação completa

---

## Possíveis Problemas e Soluções

| Problema | Causa | Solução |
|----------|-------|---------|
| API não conecta no RDS | Security Group bloqueando | Verificar SG permite porta 5432 entre App Runner e RDS |
| App Runner não puxa imagem | Permissão ECR | Verificar IAM role do App Runner tem acesso ao ECR |
| Timeout nas migrations | RDS não acessível publicamente | Rodar migration de uma EC2 na mesma VPC ou habilitar acesso público temporariamente |
| Emails não chegam (SES) | Sandbox mode | Solicitar saída do sandbox no console SES |
| `env.validation.ts` falhando | Variável faltando | Verificar todas as variáveis no Parameter Store |

---

*Documento criado em: Junho 2025*
*Última atualização: Junho 2025*
*Status: Planejado — executar quando o projeto escalar*
