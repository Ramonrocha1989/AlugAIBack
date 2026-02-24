# Sistema de Exclusão de Conta - Implementação Completa

## ✅ Implementado

### Backend

#### 1. Banco de Dados
- ✅ Tabela `delete_tokens` criada
- ✅ Campos `deletedAt` e `status` adicionados em `users`
- ✅ Índices para performance

#### 2. DTOs
- ✅ `RequestDeleteDto` - Validação de senha
- ✅ `ConfirmDeleteDto` - Validação de token

#### 3. Endpoints

##### POST /auth/request-delete
Solicita exclusão de conta (envia email com token)

**Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "password": "senha123"
}
```

**Response Success (200):**
```json
{
  "message": "Email de confirmação enviado"
}
```

**Response Error (401):**
```json
{
  "message": "Senha incorreta"
}
```

**Rate Limit:** 3 tentativas por hora

---

##### POST /auth/confirm-delete
Confirma exclusão via token do email

**Request:**
```json
{
  "token": "abc123xyz"
}
```

**Response Success (200):**
```json
{
  "message": "Conta marcada para exclusão"
}
```

**Response Error (400):**
```json
{
  "message": "Token inválido ou expirado"
}
```

---

#### 4. Serviços

##### AuthService
- ✅ `requestDelete()` - Valida senha e envia email
- ✅ `confirmDelete()` - Marca conta para exclusão (soft delete)

##### EmailService
- ✅ `sendDeleteConfirmationEmail()` - Email com link de confirmação
- ✅ `sendDeletedAccountEmail()` - Email de confirmação de exclusão

##### AccountCleanupService
- ✅ Cron job que roda diariamente às 3h da manhã
- ✅ Deleta contas marcadas há mais de 30 dias (hard delete)
- ✅ Remove todos os dados relacionados em ordem correta

---

## 🔒 Segurança

### Validações Implementadas
1. ✅ Verificação de senha antes de enviar email
2. ✅ Token com expiração de 24h
3. ✅ Token de uso único (deletado após uso)
4. ✅ Invalidação de todas as sessões após confirmação
5. ✅ Soft delete com período de graça de 30 dias
6. ✅ Rate limiting (3 tentativas por hora)

### Conformidade LGPD
- ✅ Soft delete permite recuperação em 30 dias
- ✅ Hard delete remove todos os dados pessoais
- ✅ Emails de notificação em todas as etapas

---

## 📧 Templates de Email

### Email 1: Confirmação de Exclusão
**Assunto:** Confirme a exclusão da sua conta - Mercado Máquina

**Conteúdo:**
- Nome do usuário
- Aviso de ação irreversível
- Lista do que será excluído
- Link de confirmação (expira em 24h)
- Informação sobre período de recuperação (30 dias)

### Email 2: Exclusão Confirmada
**Assunto:** Sua conta foi marcada para exclusão - Mercado Máquina

**Conteúdo:**
- Confirmação da exclusão
- Data de exclusão definitiva (30 dias)
- Informações de contato para recuperação

---

## 🗄️ Estrutura do Banco

### Tabela: delete_tokens
```prisma
model DeleteToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([expiresAt])
  @@map("delete_tokens")
}
```

### Tabela: users (campos adicionados)
```prisma
deletedAt DateTime?
status    String   @default("ACTIVE")

@@index([status])
@@index([deletedAt])
```

**Status possíveis:**
- `ACTIVE` - Conta ativa
- `DELETED` - Conta marcada para exclusão

---

## 🔄 Fluxo Completo

### 1. Solicitação de Exclusão
```
Usuário → POST /auth/request-delete
         ↓
    Valida senha
         ↓
    Gera token (24h)
         ↓
    Salva no banco
         ↓
    Envia email
         ↓
    Retorna sucesso
```

### 2. Confirmação de Exclusão
```
Usuário clica no link → POST /auth/confirm-delete
                        ↓
                   Valida token
                        ↓
                   Soft delete
                   (deletedAt = NOW())
                   (status = 'DELETED')
                        ↓
                Invalida sessões
                        ↓
                   Deleta token
                        ↓
                   Envia email
                        ↓
                  Retorna sucesso
```

### 3. Hard Delete (Automático)
```
Cron Job (3h da manhã)
         ↓
Busca contas com:
- deletedAt <= 30 dias atrás
- status = 'DELETED'
         ↓
Para cada conta:
  1. Deleta propostas
  2. Deleta notificações
  3. Deleta reviews
  4. Deleta favoritos
  5. Deleta máquinas
  6. Deleta tokens
  7. Deleta usuário
         ↓
    Log de auditoria
```

---

## 🧪 Como Testar

### 1. Executar Migration
```bash
npx prisma migrate dev --name add_account_deletion
npx prisma generate
```

### 2. Iniciar Servidor
```bash
npm run start:dev
```

### 3. Executar Script de Teste
```bash
./test-delete-account.sh
```

### 4. Testes Manuais

#### Solicitar Exclusão
```bash
curl -X POST http://localhost:3000/auth/request-delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {seu_token}" \
  -d '{"password": "sua_senha"}'
```

#### Confirmar Exclusão
```bash
curl -X POST http://localhost:3000/auth/confirm-delete \
  -H "Content-Type: application/json" \
  -d '{"token": "token_do_email"}'
```

#### Verificar Status no Banco
```sql
SELECT id, email, status, deleted_at 
FROM users 
WHERE email = 'seu@email.com';
```

#### Simular Hard Delete (Teste)
```sql
-- Ajustar data para 31 dias atrás
UPDATE users 
SET deleted_at = NOW() - INTERVAL '31 days' 
WHERE email = 'seu@email.com';

-- Executar manualmente o cron job
-- (ou aguardar até às 3h da manhã)
```

---

## 📊 Logs e Monitoramento

O `AccountCleanupService` gera logs para:
- Início da limpeza
- Quantidade de contas encontradas
- Sucesso/erro de cada exclusão
- Conclusão da limpeza

**Exemplo de logs:**
```
[AccountCleanupService] Iniciando limpeza de contas marcadas para exclusão...
[AccountCleanupService] Encontradas 3 contas para exclusão permanente
[AccountCleanupService] Conta user@example.com excluída permanentemente
[AccountCleanupService] Limpeza de contas concluída
```

---

## ⚠️ Importante

### Dados Deletados (Hard Delete)
- ✅ Dados pessoais (nome, email, telefone)
- ✅ Dados de autenticação (senha hash)
- ✅ Máquinas cadastradas
- ✅ Propostas enviadas/recebidas
- ✅ Reviews dados/recebidos
- ✅ Favoritos
- ✅ Notificações
- ✅ Todos os tokens

### Período de Recuperação
- 30 dias após confirmação
- Contato: suporte@mercadomaquina.online
- Após 30 dias: exclusão permanente e irreversível

### Rate Limiting
- Máximo 3 solicitações de exclusão por hora
- Proteção contra abuso

---

## 🚀 Próximos Passos

### Opcional (Melhorias Futuras)
- [ ] Dashboard admin para gerenciar exclusões
- [ ] Exportação de dados antes da exclusão (LGPD)
- [ ] Anonimização em vez de exclusão para dados estatísticos
- [ ] Notificações antes da exclusão definitiva (7 dias antes)
- [ ] Recuperação self-service (sem contato com suporte)

---

## 📝 Checklist de Implementação

### Backend
- [x] Criar tabela `delete_tokens`
- [x] Adicionar campos `deleted_at` e `status` em `users`
- [x] Implementar endpoint `POST /auth/request-delete`
- [x] Implementar endpoint `POST /auth/confirm-delete`
- [x] Configurar envio de emails
- [x] Criar templates de email
- [x] Implementar cron job para hard delete
- [x] Adicionar rate limiting
- [x] Adicionar logs de auditoria
- [x] Criar script de teste

### Testes
- [ ] Testar solicitação com senha correta
- [ ] Testar solicitação com senha incorreta
- [ ] Testar confirmação com token válido
- [ ] Testar confirmação com token expirado
- [ ] Testar confirmação com token inválido
- [ ] Verificar soft delete no banco
- [ ] Verificar hard delete após 30 dias
- [ ] Verificar envio de emails
- [ ] Verificar invalidação de sessões
- [ ] Verificar rate limiting

---

## 📚 Referências

- [LGPD - Lei Geral de Proteção de Dados](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling)
- [Prisma Soft Delete](https://www.prisma.io/docs/concepts/components/prisma-client/middleware/soft-delete-middleware)
