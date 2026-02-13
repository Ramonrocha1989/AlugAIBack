# API de Avaliações (Reviews) - Documentação

## ✅ Endpoints Implementados

### Base URL: `http://localhost:3000/api`

---

## 1. **POST /reviews**
Criar avaliação

**Request:**
```json
{
  "reviewedUserId": "uuid-do-vendedor",
  "machineId": "uuid-da-maquina",
  "rating": 5,
  "comment": "Ótimo vendedor, máquina conforme anunciado!"
}
```

**Response 201:**
```json
{
  "id": "uuid-da-avaliacao",
  "reviewerId": "uuid-do-avaliador",
  "reviewedUserId": "uuid-do-vendedor",
  "machineId": "uuid-da-maquina",
  "rating": 5,
  "comment": "Ótimo vendedor...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "reviewer": {
    "id": "uuid",
    "name": "João Silva"
  },
  "reviewedUser": {
    "id": "uuid",
    "name": "Maria Santos"
  },
  "machine": {
    "id": "uuid",
    "name": "Trator John Deere"
  }
}
```

**Erros:**
- `400` - Não pode avaliar a si mesmo
- `404` - Usuário ou máquina não encontrada
- `409` - Você já avaliou esta transação

---

## 2. **GET /reviews/user/:userId**
Listar avaliações recebidas por um usuário (com estatísticas)

**Response 200:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Ótimo vendedor!",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "reviewer": {
        "id": "uuid",
        "name": "João Silva"
      },
      "machine": {
        "id": "uuid",
        "name": "Trator John Deere"
      }
    }
  ],
  "stats": {
    "totalReviews": 15,
    "averageRating": 4.7,
    "fiveStars": 10,
    "fourStars": 3,
    "threeStars": 2,
    "twoStars": 0,
    "oneStar": 0
  }
}
```

---

## 3. **GET /reviews/machine/:machineId**
Listar avaliações de uma máquina específica

**Response 200:**
```json
[
  {
    "id": "uuid",
    "rating": 5,
    "comment": "Máquina em ótimo estado!",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "reviewer": {
      "id": "uuid",
      "name": "Maria Santos"
    }
  }
]
```

---

## 4. **GET /reviews/user/:userId/rating**
Obter estatísticas de avaliação de um usuário

**Response 200:**
```json
{
  "userId": "uuid",
  "totalReviews": 15,
  "averageRating": 4.7,
  "distribution": {
    "5": 10,
    "4": 3,
    "3": 2,
    "2": 0,
    "1": 0
  }
}
```

---

## 5. **PUT /reviews/:id**
Editar avaliação (até 7 dias após criação)

**Request:**
```json
{
  "rating": 4,
  "comment": "Comentário atualizado"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "rating": 4,
  "comment": "Comentário atualizado",
  "updatedAt": "2024-01-16T10:30:00.000Z"
}
```

**Erros:**
- `403` - Não pode editar após 7 dias ou não é o autor
- `404` - Avaliação não encontrada

---

## 6. **DELETE /reviews/:id**
Deletar avaliação

**Response 204:** No content

**Erros:**
- `403` - Você não pode deletar esta avaliação
- `404` - Avaliação não encontrada

---

## 🔐 Autenticação

**Endpoints que requerem JWT:**
- POST /reviews
- PUT /reviews/:id
- DELETE /reviews/:id

**Endpoints públicos:**
- GET /reviews/user/:userId
- GET /reviews/machine/:machineId
- GET /reviews/user/:userId/rating

---

## 📋 Regras de Negócio

✅ **Usuário não pode avaliar a si mesmo**
✅ **Rating deve ser entre 1 e 5**
✅ **Uma avaliação por transação** (reviewer + reviewed + machine)
✅ **Pode editar em até 7 dias** após criação
✅ **Apenas o autor pode editar/deletar**
✅ **Média calculada automaticamente**
✅ **Cascade delete** - remove avaliações se usuário for deletado
✅ **Set null** - mantém avaliação se máquina for deletada

---

## 📦 Exemplo de Integração (React Query)

```typescript
// 1. Criar avaliação
const createReview = useMutation({
  mutationFn: async (data: {
    reviewedUserId: string;
    machineId?: string;
    rating: number;
    comment?: string;
  }) => {
    const res = await fetch('http://localhost:3000/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
});

// 2. Listar avaliações de um usuário
const { data } = useQuery({
  queryKey: ['reviews', userId],
  queryFn: async () => {
    const res = await fetch(`http://localhost:3000/api/reviews/user/${userId}`);
    return res.json();
  },
});

// 3. Obter rating de um usuário
const { data: rating } = useQuery({
  queryKey: ['user-rating', userId],
  queryFn: async () => {
    const res = await fetch(`http://localhost:3000/api/reviews/user/${userId}/rating`);
    return res.json();
  },
});

// 4. Editar avaliação
const updateReview = useMutation({
  mutationFn: async ({ id, data }: { id: string; data: any }) => {
    const res = await fetch(`http://localhost:3000/api/reviews/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
});

// 5. Deletar avaliação
const deleteReview = useMutation({
  mutationFn: async (id: string) => {
    await fetch(`http://localhost:3000/api/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
});
```

---

## 🗄️ Modelo de Dados

```prisma
model Review {
  id             String   @id @default(uuid())
  reviewerId     String
  reviewedUserId String
  machineId      String?
  rating         Int
  comment        String?  @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  reviewer     User     @relation("ReviewerUser", fields: [reviewerId], references: [id], onDelete: Cascade)
  reviewedUser User     @relation("ReviewedUser", fields: [reviewedUserId], references: [id], onDelete: Cascade)
  machine      Machine? @relation(fields: [machineId], references: [id], onDelete: SetNull)

  @@unique([reviewerId, reviewedUserId, machineId])
  @@index([reviewedUserId])
  @@index([reviewerId])
  @@index([machineId])
  @@map("reviews")
}
```

---

## 🧪 Testes com cURL

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"senha"}' \
  | jq -r '.access_token')

# 2. Criar avaliação
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewedUserId": "uuid-vendedor",
    "machineId": "uuid-maquina",
    "rating": 5,
    "comment": "Ótimo vendedor!"
  }'

# 3. Listar avaliações de um usuário
curl http://localhost:3000/api/reviews/user/uuid-usuario

# 4. Obter rating
curl http://localhost:3000/api/reviews/user/uuid-usuario/rating

# 5. Listar avaliações de uma máquina
curl http://localhost:3000/api/reviews/machine/uuid-maquina

# 6. Editar avaliação
curl -X PUT http://localhost:3000/api/reviews/uuid-avaliacao \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4, "comment": "Atualizado"}'

# 7. Deletar avaliação
curl -X DELETE http://localhost:3000/api/reviews/uuid-avaliacao \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎨 Sugestão de UI

**Componente de Avaliação:**
- Estrelas clicáveis (1-5)
- Campo de comentário opcional
- Validação: não pode avaliar a si mesmo

**Página de Perfil do Vendedor:**
- Média de avaliações com estrelas
- Total de avaliações
- Gráfico de distribuição (5★, 4★, 3★, 2★, 1★)
- Lista de avaliações recentes

**Página da Máquina:**
- Avaliações relacionadas à máquina
- Rating do vendedor

---

## 🚀 Pronto!

Sistema de avaliações completo e funcional! 

Acesse a documentação Swagger em: **http://localhost:3000/api/docs**
