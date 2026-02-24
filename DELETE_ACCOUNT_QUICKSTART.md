# Guia Rápido - Exclusão de Conta

## 🚀 Setup Rápido (5 minutos)

### 1. Executar Migration
```bash
npx prisma migrate dev --name add_account_deletion
npx prisma generate
```

### 2. Instalar Dependência
```bash
npm install @nestjs/schedule
```

### 3. Iniciar Servidor
```bash
npm run start:dev
```

✅ Pronto! O sistema está funcionando.

---

## 📝 Como Usar

### Frontend - Solicitar Exclusão

```typescript
// 1. Usuário clica em "Excluir Conta"
// 2. Modal pede confirmação com senha

const handleDeleteAccount = async (password: string) => {
  try {
    const response = await fetch('http://localhost:3000/auth/request-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('Email de confirmação enviado! Verifique sua caixa de entrada.');
    } else {
      alert(data.message); // "Senha incorreta"
    }
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

### Frontend - Confirmar Exclusão

```typescript
// Página: /confirm-delete?token=abc123

const handleConfirmDelete = async (token: string) => {
  try {
    const response = await fetch('http://localhost:3000/auth/confirm-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('Conta marcada para exclusão. Você tem 30 dias para recuperá-la.');
      // Redirecionar para página de logout
      window.location.href = '/';
    } else {
      alert(data.message); // "Token inválido ou expirado"
    }
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

---

## 🧪 Testar Rapidamente

### Opção 1: Script Automatizado
```bash
./test-delete-account.sh
```

### Opção 2: cURL Manual

#### 1. Solicitar Exclusão
```bash
curl -X POST http://localhost:3000/auth/request-delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"password": "sua_senha"}'
```

#### 2. Pegar Token do Banco
```sql
SELECT token FROM delete_tokens 
ORDER BY created_at DESC 
LIMIT 1;
```

#### 3. Confirmar Exclusão
```bash
curl -X POST http://localhost:3000/auth/confirm-delete \
  -H "Content-Type: application/json" \
  -d '{"token": "TOKEN_DO_BANCO"}'
```

#### 4. Verificar Status
```sql
SELECT email, status, deleted_at 
FROM users 
WHERE email = 'seu@email.com';
```

---

## ⏰ Cron Job (Hard Delete)

### Execução Automática
- Roda todo dia às **3h da manhã**
- Deleta contas marcadas há **mais de 30 dias**

### Testar Manualmente

#### 1. Ajustar Data no Banco
```sql
UPDATE users 
SET deleted_at = NOW() - INTERVAL '31 days' 
WHERE email = 'teste@example.com';
```

#### 2. Executar Cron Job
O cron job roda automaticamente. Para testar imediatamente, você pode:
- Aguardar até às 3h da manhã, ou
- Criar um endpoint temporário para executar manualmente

---

## 📧 Emails Enviados

### 1. Confirmação de Exclusão
- **Quando:** Ao solicitar exclusão
- **Conteúdo:** Link de confirmação (expira em 24h)
- **Ação:** Usuário clica no link

### 2. Exclusão Confirmada
- **Quando:** Após confirmar exclusão
- **Conteúdo:** Data de exclusão definitiva (30 dias)
- **Ação:** Informativo

---

## 🔒 Segurança

### Rate Limiting
- **3 tentativas** por hora
- Proteção contra abuso

### Validações
- ✅ Senha obrigatória
- ✅ Token único e temporário (24h)
- ✅ Invalidação de todas as sessões
- ✅ Soft delete (30 dias de recuperação)

---

## ❓ FAQ

### Como recuperar uma conta?
Dentro de 30 dias, entre em contato:
- Email: suporte@mercadomaquina.online

### O que acontece após 30 dias?
- Exclusão permanente e irreversível
- Todos os dados são deletados

### Posso cancelar a exclusão?
Sim, dentro de 30 dias através do suporte.

### O que é deletado?
- Dados pessoais
- Máquinas cadastradas
- Propostas e negociações
- Reviews e favoritos
- Todos os tokens

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- [DELETE_ACCOUNT_IMPLEMENTATION.md](./DELETE_ACCOUNT_IMPLEMENTATION.md)
