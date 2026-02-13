# API de Notificações - Documentação

## ✅ Endpoints Implementados

### Base URL: `http://localhost:3000/api`

---

## 1. **GET /notifications**
Listar notificações do usuário

**Query Params:**
- `read` (opcional): `true` | `false` | omitir (todas)
- `limit` (opcional): número (padrão: 20, máx: 100)
- `offset` (opcional): número (padrão: 0)

**Response 200:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "NEW_REVIEW",
      "title": "Nova avaliação recebida",
      "message": "João Silva avaliou você com 5 estrelas",
      "link": "/dashboard/reviews",
      "read": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 15,
  "unreadCount": 3
}
```

---

## 2. **GET /notifications/unread-count**
Contador de notificações não lidas

**Response 200:**
```json
{
  "count": 3
}
```

---

## 3. **PUT /notifications/:id/read**
Marcar notificação como lida

**Response 200:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "NEW_REVIEW",
  "title": "Nova avaliação recebida",
  "message": "João Silva avaliou você com 5 estrelas",
  "link": "/dashboard/reviews",
  "read": true,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 4. **PUT /notifications/read-all**
Marcar todas as notificações como lidas

**Response 200:**
```json
{
  "updated": 5
}
```

---

## 5. **DELETE /notifications/:id**
Deletar notificação

**Response 204:** No content

---

## 🔐 Autenticação

**Todos os endpoints requerem JWT:**
```
Authorization: Bearer SEU_TOKEN_JWT
```

---

## 📋 Tipos de Notificações

```typescript
enum NotificationType {
  NEW_REVIEW = 'NEW_REVIEW',       // Nova avaliação recebida
  PRICE_DROP = 'PRICE_DROP',       // Preço baixou em favorito
  NEW_MESSAGE = 'NEW_MESSAGE',     // Nova mensagem (futuro)
  NEW_MACHINE = 'NEW_MACHINE',     // Nova máquina de interesse
  MACHINE_SOLD = 'MACHINE_SOLD'    // Máquina vendida/alugada
}
```

---

## 🔔 Eventos que Geram Notificações

### 1. Nova Avaliação Recebida
Quando alguém avalia você:
```typescript
{
  type: 'NEW_REVIEW',
  title: 'Nova avaliação recebida',
  message: 'João Silva avaliou você com 5 estrelas',
  link: '/dashboard/reviews'
}
```

### 2. Preço Baixou (Futuro)
Quando uma máquina favoritada tem o preço reduzido:
```typescript
{
  type: 'PRICE_DROP',
  title: 'Preço reduzido!',
  message: 'Trator John Deere agora por R$ 250.000',
  link: '/machines/uuid'
}
```

### 3. Nova Máquina (Futuro)
Quando uma nova máquina de interesse é cadastrada:
```typescript
{
  type: 'NEW_MACHINE',
  title: 'Nova máquina disponível',
  message: 'Colheitadeira Case IH 2023 em Passo Fundo',
  link: '/machines/uuid'
}
```

---

## 📦 Exemplo de Integração (React Query)

```typescript
// 1. Listar notificações
const { data } = useQuery({
  queryKey: ['notifications'],
  queryFn: async () => {
    const res = await fetch('http://localhost:3000/api/notifications', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },
  refetchInterval: 30000, // Atualiza a cada 30s
});

// 2. Contador de não lidas
const { data: unreadCount } = useQuery({
  queryKey: ['notifications-unread'],
  queryFn: async () => {
    const res = await fetch('http://localhost:3000/api/notifications/unread-count', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },
  refetchInterval: 10000, // Atualiza a cada 10s
});

// 3. Marcar como lida
const markAsRead = useMutation({
  mutationFn: async (id: string) => {
    const res = await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['notifications-unread']);
  },
});

// 4. Marcar todas como lidas
const markAllAsRead = useMutation({
  mutationFn: async () => {
    const res = await fetch('http://localhost:3000/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['notifications-unread']);
  },
});

// 5. Deletar notificação
const deleteNotification = useMutation({
  mutationFn: async (id: string) => {
    await fetch(`http://localhost:3000/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['notifications']);
  },
});
```

---

## 🗄️ Modelo de Dados

```prisma
model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String
  message   String           @db.Text
  link      String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([read])
  @@index([createdAt(sort: Desc)])
  @@map("notifications")
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

# 2. Listar todas as notificações
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# 3. Listar apenas não lidas
curl "http://localhost:3000/api/notifications?read=false" \
  -H "Authorization: Bearer $TOKEN"

# 4. Contador de não lidas
curl http://localhost:3000/api/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN"

# 5. Marcar como lida
curl -X PUT http://localhost:3000/api/notifications/uuid-notificacao/read \
  -H "Authorization: Bearer $TOKEN"

# 6. Marcar todas como lidas
curl -X PUT http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer $TOKEN"

# 7. Deletar notificação
curl -X DELETE http://localhost:3000/api/notifications/uuid-notificacao \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎨 Sugestão de UI

**Badge de Notificações:**
- Ícone de sino com badge mostrando contador de não lidas
- Atualização em tempo real (polling ou WebSocket)

**Dropdown de Notificações:**
- Lista das últimas 5-10 notificações
- Botão "Marcar todas como lidas"
- Link para página completa de notificações

**Página de Notificações:**
- Lista completa com paginação
- Filtros: Todas | Não lidas | Lidas
- Ação de deletar individual
- Notificações não lidas com destaque visual

---

## ✅ Características

✅ **Autenticação obrigatória** - Todos os endpoints requerem JWT
✅ **Paginação** - Suporte a limit e offset
✅ **Filtros** - Por status de leitura
✅ **Contador em tempo real** - Endpoint otimizado para polling
✅ **Cascade delete** - Remove notificações quando usuário é deletado
✅ **Índices otimizados** - Performance em queries
✅ **Integração automática** - Notificação criada ao receber review

---

## 🚀 Pronto!

Sistema de notificações completo e funcional!

Acesse a documentação Swagger em: **http://localhost:3000/api/docs**
