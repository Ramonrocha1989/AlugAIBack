# Testes de Recuperação de Senha

## 1. Solicitar recuperação de senha

POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@exemplo.com"
}

### Resposta esperada (200 OK):
```json
{
  "message": "Email de recuperação enviado com sucesso"
}
```


---

## 2. Resetar senha com token

POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "token": "TOKEN_RECEBIDO_POR_EMAIL",
  "password": "novaSenha123"
}

### Resposta esperada (200 OK):
```json
{
  "message": "Senha alterada com sucesso"
}
```

### Resposta de erro (400 Bad Request):
```json
{
  "error": "Token inválido ou expirado"
}
```

---

## Fluxo completo de teste

1. **Registre um usuário** (se ainda não tiver):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "senha123",
    "companyName": "Empresa Teste"
  }'
```

2. **Solicite recuperação de senha**:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "teste@exemplo.com"}'
```

3. **Verifique o email** e copie o token do link

4. **Resete a senha**:
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "SEU_TOKEN_AQUI",
    "password": "novaSenha456"
  }'
```

5. **Faça login com a nova senha**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "novaSenha456"
  }'
```
