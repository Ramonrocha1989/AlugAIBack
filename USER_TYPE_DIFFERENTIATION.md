# Diferenciação de Usuários: Pessoa Física vs Empresa

## Visão Geral

O sistema agora suporta dois tipos de usuários:
- **INDIVIDUAL** (Pessoa Física)
- **COMPANY** (Empresa)

## Mudanças no Banco de Dados

### Novos Campos na Tabela `users`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `user_type` | UserType | Sim | Tipo do usuário (INDIVIDUAL ou COMPANY) |
| `full_name` | String | Condicional | Nome completo (obrigatório para INDIVIDUAL) |
| `cpf` | String | Não | CPF (opcional para INDIVIDUAL) |
| `responsible_name` | String | Condicional | Nome do responsável (obrigatório para COMPANY) |

### Alterações

- Campo `companyId` agora é **opcional**
- Usuários existentes migrados automaticamente como `COMPANY`

## API - Endpoint de Registro

### POST `/api/auth/register`

#### Pessoa Física (INDIVIDUAL)

```json
{
  "userType": "INDIVIDUAL",
  "fullName": "João Silva",
  "cpf": "12345678901",
  "phone": "51999887766",
  "email": "joao@email.com",
  "password": "MinhaSenh@123"
}
```

**Campos obrigatórios:**
- `userType`: "INDIVIDUAL"
- `fullName`: Nome completo
- `phone`: Telefone
- `email`: Email
- `password`: Senha forte

**Campos opcionais:**
- `cpf`: CPF (validado se fornecido)

#### Empresa (COMPANY)

```json
{
  "userType": "COMPANY",
  "companyName": "Empresa LTDA",
  "cnpj": "12345678000199",
  "responsibleName": "Maria Santos",
  "phone": "51999887766",
  "email": "empresa@email.com",
  "password": "MinhaSenh@123"
}
```

**Campos obrigatórios:**
- `userType`: "COMPANY"
- `companyName`: Nome da empresa
- `responsibleName`: Nome do responsável
- `phone`: Telefone
- `email`: Email
- `password`: Senha forte

**Campos opcionais:**
- `cnpj`: CNPJ (validado se fornecido)

## Resposta da API

### Estrutura de Resposta

```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva" | "Empresa LTDA",
    "email": "email@example.com",
    "phone": "5551999887766",
    "role": "COMPANY",
    "userType": "INDIVIDUAL" | "COMPANY",
    "plan": "free",
    "emailVerified": false,
    "company": {
      "id": "uuid",
      "name": "João Silva" | "Empresa LTDA",
      "document": "12345678901" | "12345678000199"
    }
  },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "message": "Cadastro realizado! Verifique seu email para ativar sua conta."
}
```

### Campo `name` na Resposta

- **INDIVIDUAL**: Retorna `fullName`
- **COMPANY**: Retorna `companyName`

## Validações

### Validação por Tipo

| Tipo | Validações |
|------|-----------|
| INDIVIDUAL | `fullName` obrigatório, `cpf` opcional mas validado |
| COMPANY | `companyName` e `responsibleName` obrigatórios, `cnpj` opcional mas validado |

### Validação de Documentos

- **CPF**: 11 dígitos, validação de formato
- **CNPJ**: 14 dígitos, validação de formato
- Documentos são normalizados (removidos caracteres especiais)
- Validação de duplicidade no banco

### Validação de Senha

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número

## Compatibilidade

### Usuários Existentes

- Todos os usuários existentes foram migrados como `userType = 'COMPANY'`
- Nenhuma alteração necessária no frontend para usuários já cadastrados
- Endpoints atuais continuam funcionando normalmente

### Endpoints Afetados

Todos os endpoints que retornam dados do usuário agora incluem o campo `userType`:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`

## Migração

### Aplicar Migration

```bash
# Opção 1: Script automatizado
./scripts/apply-user-type-migration.sh

# Opção 2: Comandos manuais
npx prisma migrate deploy
npx prisma generate
```

### Testar Implementação

```bash
./scripts/test-user-types.sh
```

## Exemplos de Uso

### Frontend - React Query

```typescript
// Cadastro de Pessoa Física
const registerIndividual = useMutation({
  mutationFn: async (data) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userType: 'INDIVIDUAL',
        fullName: data.fullName,
        cpf: data.cpf,
        phone: data.phone,
        email: data.email,
        password: data.password,
      }),
    });
    return response.json();
  },
});

// Cadastro de Empresa
const registerCompany = useMutation({
  mutationFn: async (data) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userType: 'COMPANY',
        companyName: data.companyName,
        cnpj: data.cnpj,
        responsibleName: data.responsibleName,
        phone: data.phone,
        email: data.email,
        password: data.password,
      }),
    });
    return response.json();
  },
});
```

## Troubleshooting

### Erro: "Campos obrigatórios não preenchidos"

Verifique se está enviando os campos corretos para cada tipo:
- **INDIVIDUAL**: `fullName` é obrigatório
- **COMPANY**: `companyName` e `responsibleName` são obrigatórios

### Erro: "CPF/CNPJ já cadastrado"

O documento (CPF ou CNPJ) já existe no banco de dados. Use outro documento ou faça login.

### Erro: "CPF inválido" ou "CNPJ inválido"

O formato do documento está incorreto. Envie apenas números (sem pontos, traços ou barras).

## Próximos Passos

- [ ] Adicionar campos específicos para cada tipo no perfil
- [ ] Implementar filtros por tipo de usuário no admin
- [ ] Adicionar relatórios separados por tipo
- [ ] Permitir conversão de INDIVIDUAL para COMPANY
