# Teste de Verificação de Email

## Fluxo Completo

### 1. Cadastro de Usuário

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "teste@example.com",
  "password": "senha123",
  "companyName": "Empresa Teste",
  "name": "João Silva"
}
```

**Resposta esperada:**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "teste@example.com",
    "role": "COMPANY",
    "company": { ... }
  },
  "token": "jwt-token",
  "message": "Cadastro realizado! Verifique seu email para ativar sua conta."
}
```

**O que acontece:**
- ✅ Usuário criado com `emailVerified: false`
- ✅ Token de verificação gerado (válido por 24h)
- ✅ Email enviado com link: `http://localhost:3001/verify-email?token=abc123`

---

### 2. Tentativa de Login (SEM verificar email)

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "teste@example.com",
  "password": "senha123"
}
```

**Resposta esperada:**
```json
{
  "statusCode": 401,
  "message": "Email não verificado. Verifique sua caixa de entrada."
}
```

---

### 3. Verificação de Email

```bash
POST http://localhost:3000/api/auth/verify-email
Content-Type: application/json

{
  "token": "token-recebido-por-email"
}
```

**Resposta esperada:**
```json
{
  "message": "Email verificado com sucesso"
}
```

**O que acontece:**
- ✅ `emailVerified` atualizado para `true`
- ✅ Token marcado como usado (`usedAt`)

---

### 4. Login (APÓS verificar email)

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "teste@example.com",
  "password": "senha123"
}
```

**Resposta esperada:**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "teste@example.com",
    "role": "COMPANY",
    "company": { ... }
  },
  "token": "jwt-token"
}
```

---

## Casos de Erro

### Token Inválido ou Expirado

```bash
POST http://localhost:3000/api/auth/verify-email
Content-Type: application/json

{
  "token": "token-invalido"
}
```

**Resposta:**
```json
{
  "statusCode": 400,
  "message": "Token inválido ou expirado"
}
```

---

## Verificação no Banco de Dados

```sql
-- Ver usuários e status de verificação
SELECT id, name, email, "emailVerified", "createdAt" 
FROM users;

-- Ver tokens de verificação
SELECT id, "userId", token, "expiresAt", "usedAt" 
FROM email_verification_tokens;
```

---

## Integração com Frontend

O frontend já está configurado para:

1. **Após cadastro**: Mostrar mensagem "Verifique seu email"
2. **Página `/verify-email`**: Processar o token da URL
3. **Após verificação**: Redirecionar para login

---

## Configuração de Email

Certifique-se de que o `.env` está configurado:

```env
FRONTEND_URL="http://localhost:3001"
RESEND_API_KEY="re_your_api_key_here"
```

---

## Testando Localmente

1. Inicie o backend:
```bash
npm run start:dev
```

2. Cadastre um usuário
3. Verifique o console do backend para ver o link de verificação
4. Copie o token do link e use no endpoint `/verify-email`
5. Faça login normalmente

---

## Notas

- Token de verificação expira em **24 horas**
- Token só pode ser usado **uma vez**
- Usuários não verificados **não podem fazer login**
- Email é enviado automaticamente após cadastro
