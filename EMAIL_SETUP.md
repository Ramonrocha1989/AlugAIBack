# Configuração de Email para Recuperação de Senha

## Como configurar o Gmail

1. **Acesse sua conta Google**: https://myaccount.google.com/

2. **Ative a verificação em duas etapas**:
   - Vá em "Segurança"
   - Ative "Verificação em duas etapas"

3. **Crie uma senha de app**:
   - Ainda em "Segurança"
   - Procure por "Senhas de app"
   - Selecione "E-mail" e "Outro (nome personalizado)"
   - Digite "EquipRent Backend"
   - Copie a senha gerada (16 caracteres)

4. **Configure o .env**:
```env
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # Senha de app gerada
FRONTEND_URL="http://localhost:3000"
```

## Testando

### 1. Solicitar recuperação de senha
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@exemplo.com"}'
```

### 2. Resetar senha com token
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_RECEBIDO_POR_EMAIL","password":"novaSenha123"}'
```

## Alternativas ao Gmail

### SendGrid (Recomendado para produção)
```bash
npm install @sendgrid/mail
```

### AWS SES
```bash
npm install @aws-sdk/client-ses
```

### Nodemailer com SMTP customizado
Configure qualquer servidor SMTP no `email.service.ts`
