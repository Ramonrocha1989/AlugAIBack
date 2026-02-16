# 💼 API de Propostas - Documentação

## ✅ IMPLEMENTAÇÃO COMPLETA

Sistema de propostas comerciais para negociação de máquinas.

---

## 📋 ENDPOINTS DISPONÍVEIS

### 1. **POST /api/proposals** 🔒
Criar nova proposta (requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "machineId": "550e8400-e29b-41d4-a716-446655440000",
  "proposedPrice": 250000,
  "message": "Tenho interesse na máquina. Posso pagar à vista com esse valor."
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "machineId": "uuid",
  "senderId": "uuid",
  "receiverId": "uuid",
  "proposedPrice": 250000,
  "message": "Tenho interesse na máquina...",
  "status": "PENDING",
  "counterPrice": null,
  "counterMessage": null,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "machine": {
    "id": "uuid",
    "name": "Trator John Deere 6125J",
    "price": 285000,
    "images": ["url1", "url2"]
  },
  "sender": {
    "id": "uuid",
    "name": "João Silva"
  },
  "receiver": {
    "id": "uuid",
    "name": "Maria Santos"
  }
}
```

---

### 2. **GET /api/proposals?type=sent|received** 🔒
Listar propostas (requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `type` - `sent` (enviadas) ou `received` (recebidas) - padrão: `received`

**Exemplos:**
```bash
# Propostas recebidas (padrão)
GET /api/proposals

# Propostas enviadas
GET /api/proposals?type=sent
```

**Response 200:**
```json
[
  {
    "id": "uuid",
    "machineId": "uuid",
    "senderId": "uuid",
    "receiverId": "uuid",
    "proposedPrice": 250000,
    "message": "Tenho interesse...",
    "status": "PENDING",
    "counterPrice": null,
    "counterMessage": null,
    "viewedByReceiver": false,
    "viewedBySender": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "machine": {
      "id": "uuid",
      "name": "Trator John Deere 6125J",
      "price": 285000,
      "images": ["url1", "url2"]
    },
    "sender": {
      "id": "uuid",
      "name": "João Silva"
    },
    "receiver": {
      "id": "uuid",
      "name": "Maria Santos"
    }
  }
]
```

---

### 3. **PATCH /api/proposals/:id/accept** 🔒
Aceitar proposta (requer autenticação, apenas dono da máquina)

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "ACCEPTED",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 4. **PATCH /api/proposals/:id/reject** 🔒
Recusar proposta (requer autenticação, apenas dono da máquina)

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 5. **PATCH /api/proposals/:id/counter** 🔒
Fazer contra-proposta (requer autenticação, apenas dono da máquina)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "counterPrice": 270000,
  "counterMessage": "Posso aceitar por esse valor, mas precisa ser à vista."
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "COUNTERED",
  "counterPrice": 270000,
  "counterMessage": "Posso aceitar por esse valor...",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 6. **DELETE /api/proposals/:id** 🔒
Cancelar proposta (requer autenticação, apenas remetente)

**Headers:**
```
Authorization: Bearer {token}
```

**Response 204:** No Content

---

### 7. **PATCH /api/proposals/:id/view** 🔒
Marcar proposta como vista (requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200:**
```json
{
  "id": "uuid",
  "viewedByReceiver": true,
  "viewedBySender": false,
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Lógica:**
- Se usuário é o receiver → marca `viewedByReceiver = true`
- Se usuário é o sender → marca `viewedBySender = true`

---

## 🎯 STATUS DISPONÍVEIS

| Status | Descrição |
|--------|-----------|
| `PENDING` | Aguardando resposta |
| `ACCEPTED` | Aceita pelo vendedor |
| `REJECTED` | Recusada pelo vendedor |
| `COUNTERED` | Vendedor fez contra-proposta |

---

## ✅ VALIDAÇÕES IMPLEMENTADAS

### Criar Proposta:
- ✅ Máquina deve existir
- ✅ Não pode fazer proposta para própria máquina
- ✅ Preço deve ser positivo
- ✅ Mensagem: mínimo 10, máximo 1000 caracteres

### Aceitar/Recusar:
- ✅ Apenas dono da máquina pode aceitar/recusar
- ✅ Apenas propostas PENDING ou COUNTERED podem ser processadas

### Contra-proposta:
- ✅ Apenas dono da máquina pode contra-propor
- ✅ Apenas propostas PENDING podem receber contra-proposta
- ✅ Preço deve ser positivo
- ✅ Mensagem: mínimo 10, máximo 1000 caracteres

### Cancelar:
- ✅ Apenas remetente pode cancelar
- ✅ Apenas propostas PENDING podem ser canceladas

---

## 🗄️ BANCO DE DADOS

### Tabela: `proposals`

**Campos:**
- `id` - UUID
- `machineId` - UUID (FK)
- `senderId` - UUID (FK)
- `receiverId` - UUID (FK)
- `proposedPrice` - Decimal(12,2)
- `message` - Text
- `status` - Enum (PENDING, ACCEPTED, REJECTED, COUNTERED)
- `counterPrice` - Decimal(12,2) nullable
- `counterMessage` - Text nullable
- `viewedByReceiver` - Boolean (default: false)
- `viewedBySender` - Boolean (default: false)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

**Índices:**
- machineId
- senderId
- receiverId
- status

**Relações:**
- Delete em cascata quando máquina é deletada
- Delete em cascata quando usuário é deletado

---

## 🚀 COMO TESTAR

### 1. Criar proposta:
```bash
curl -X POST http://localhost:3000/api/proposals \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "uuid-da-maquina",
    "proposedPrice": 250000,
    "message": "Tenho interesse na máquina. Posso pagar à vista."
  }'
```

### 2. Listar propostas recebidas:
```bash
curl http://localhost:3000/api/proposals \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 3. Aceitar proposta:
```bash
curl -X PATCH http://localhost:3000/api/proposals/uuid-proposta/accept \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 4. Fazer contra-proposta:
```bash
curl -X PATCH http://localhost:3000/api/proposals/uuid-proposta/counter \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "counterPrice": 270000,
    "counterMessage": "Posso aceitar por esse valor à vista."
  }'
```

---

## 📊 FLUXO DE NEGOCIAÇÃO

```
1. Comprador cria proposta → Status: PENDING
2. Vendedor pode:
   a) Aceitar → Status: ACCEPTED (fim)
   b) Recusar → Status: REJECTED (fim)
   c) Contra-propor → Status: COUNTERED
3. Se COUNTERED, comprador pode:
   a) Aceitar contra-proposta → Status: ACCEPTED (fim)
   b) Cancelar → Proposta deletada
```

---

## 🎉 IMPLEMENTAÇÃO CONCLUÍDA

✅ Model Proposal com relacionamentos
✅ 7 endpoints funcionais
✅ Validações Zod completas
✅ Regras de negócio implementadas
✅ Índices de performance
✅ Delete em cascata
✅ Autenticação JWT
✅ Campos viewed para notificações
✅ Documentação Swagger

**Acesse:** http://localhost:3000/api/docs
