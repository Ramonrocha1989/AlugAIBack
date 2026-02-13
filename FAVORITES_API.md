# API de Favoritos - Documentação

## Endpoints Implementados

### 1. POST /api/favorites
**Adicionar máquina aos favoritos**

```bash
curl -X POST http://localhost:3000/api/favorites \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "uuid-da-maquina"
  }'
```

**Response (201):**
```json
{
  "id": "uuid-do-favorito",
  "userId": "uuid-do-usuario",
  "machineId": "uuid-da-maquina",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Erros:**
- 404: Máquina não encontrada
- 409: Máquina já está nos favoritos

---

### 2. DELETE /api/favorites/:machineId
**Remover máquina dos favoritos**

```bash
curl -X DELETE http://localhost:3000/api/favorites/uuid-da-maquina \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Response (200):**
```json
{
  "message": "Favorito removido com sucesso"
}
```

---

### 3. GET /api/favorites
**Listar todos os favoritos do usuário**

```bash
curl http://localhost:3000/api/favorites \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Response (200):**
```json
[
  {
    "id": "uuid-do-favorito",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "machine": {
      "id": "uuid",
      "name": "Trator John Deere 6175R",
      "price": "285000.00",
      "images": ["url1", "url2"],
      "city": "Passo Fundo",
      "state": "RS",
      "yearModel": 2019,
      "manufacturer": "John Deere",
      "category": "TRACTORS",
      "businessType": "SALE",
      "description": "...",
      "model": "6175R",
      "power": 175,
      "engineHours": 1200,
      "available": true,
      "views": 45,
      "ownerId": "uuid",
      "ownerName": "Empresa XYZ",
      "ownerPhone": "+55 54 99999-9999",
      "isVerifiedSeller": true,
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
]
```

---

### 4. GET /api/favorites/check/:machineId
**Verificar se uma máquina está nos favoritos**

```bash
curl http://localhost:3000/api/favorites/check/uuid-da-maquina \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Response (200):**
```json
{
  "isFavorited": true
}
```

---

## Características

✅ **Autenticação obrigatória** - Todos os endpoints requerem JWT
✅ **Validação com Zod** - Validação de dados em tempo de execução
✅ **Constraint única** - Não permite duplicatas (userId + machineId)
✅ **Cascade delete** - Remove favoritos quando usuário ou máquina são deletados
✅ **Índices otimizados** - Performance em queries por userId e machineId
✅ **Documentação Swagger** - Disponível em `/api/docs`

---

## Modelo de Dados

```prisma
model Favorite {
  id        String   @id @default(uuid())
  userId    String
  machineId String
  createdAt DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  machine Machine @relation(fields: [machineId], references: [id], onDelete: Cascade)

  @@unique([userId, machineId])
  @@index([userId])
  @@index([machineId])
  @@map("favorites")
}
```

---

## Integração com Frontend (React Query)

```typescript
// Hook para adicionar favorito
const addFavoriteMutation = useMutation({
  mutationFn: async (machineId: string) => {
    const response = await fetch('http://localhost:3000/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ machineId }),
    });
    if (!response.ok) throw new Error('Erro ao adicionar favorito');
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['favorites']);
  },
});

// Hook para remover favorito
const removeFavoriteMutation = useMutation({
  mutationFn: async (machineId: string) => {
    const response = await fetch(`http://localhost:3000/api/favorites/${machineId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Erro ao remover favorito');
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['favorites']);
  },
});

// Hook para listar favoritos
const { data: favorites } = useQuery({
  queryKey: ['favorites'],
  queryFn: async () => {
    const response = await fetch('http://localhost:3000/api/favorites', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Erro ao buscar favoritos');
    return response.json();
  },
});

// Hook para verificar se está favoritado
const { data: favoriteStatus } = useQuery({
  queryKey: ['favorite-status', machineId],
  queryFn: async () => {
    const response = await fetch(`http://localhost:3000/api/favorites/check/${machineId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Erro ao verificar favorito');
    return response.json();
  },
  enabled: !!machineId,
});
```

---

## Testando a API

1. **Faça login para obter o token:**
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"senha"}' \
  | jq -r '.access_token')
```

2. **Liste as máquinas disponíveis:**
```bash
curl http://localhost:3000/api/machines | jq
```

3. **Adicione uma máquina aos favoritos:**
```bash
MACHINE_ID="cole-o-id-aqui"
curl -X POST http://localhost:3000/api/favorites \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"machineId\":\"$MACHINE_ID\"}" | jq
```

4. **Liste seus favoritos:**
```bash
curl http://localhost:3000/api/favorites \
  -H "Authorization: Bearer $TOKEN" | jq
```

5. **Verifique se está favoritado:**
```bash
curl http://localhost:3000/api/favorites/check/$MACHINE_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

6. **Remova dos favoritos:**
```bash
curl -X DELETE http://localhost:3000/api/favorites/$MACHINE_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Pronto! 🚀

O sistema de favoritos está completamente implementado e pronto para uso!

Acesse a documentação Swagger em: **http://localhost:3000/api/docs**
