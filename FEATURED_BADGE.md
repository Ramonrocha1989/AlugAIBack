# ⭐ Badge "Destaque" - Documentação Backend

## ✅ O que já está implementado

### 1. Campo `isFeatured` no Schema
```prisma
model Machine {
  // ...
  isFeatured  Boolean  @default(false)
  // ...
}
```

### 2. Endpoint Admin para Destacar Máquina

**PATCH /api/admin/machines/:id/feature**

```bash
# Destacar uma máquina
curl -X PATCH http://localhost:3000/api/admin/machines/{machineId}/feature \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "isFeatured": true
  }'
```

**Request Body:**
```typescript
{
  isFeatured: boolean  // true = destacar, false = remover destaque
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Trator John Deere 6110J",
  "isFeatured": true,
  // ... outros campos
}
```

### 3. Campo já retorna em todos os endpoints

✅ **GET /api/machines** - Lista com campo `isFeatured`
✅ **GET /api/machines/:id** - Detalhes com campo `isFeatured`
✅ **GET /api/machines/my** - Minhas máquinas com campo `isFeatured`
✅ **GET /api/admin/machines** - Admin vê todas com campo `isFeatured`

**Exemplo de resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Trator John Deere 6110J",
      "isFeatured": true,  // ← Campo já existe
      "price": 250000,
      // ...
    }
  ]
}
```

## 🎨 O que o Front precisa fazer

### 1. Adicionar Badge "Destaque" no Card

```tsx
// machine-card.tsx
{machine.isFeatured && (
  <Badge variant="warning" className="gap-1">
    <Star className="h-3 w-3 fill-current" />
    Destaque
  </Badge>
)}
```

### 2. Criar Filtro de Máquinas em Destaque (Opcional)

```typescript
// Buscar apenas máquinas em destaque
const { data } = useQuery({
  queryKey: ['machines', 'featured'],
  queryFn: async () => {
    const response = await fetch('http://localhost:3000/api/machines?isFeatured=true');
    return response.json();
  },
});
```

### 3. Seção "Máquinas em Destaque" na Home (Opcional)

```tsx
// home.tsx
<section>
  <h2>Máquinas em Destaque ⭐</h2>
  <MachineGrid machines={featuredMachines} />
</section>
```

## 🔧 Funcionalidades Admin

### Painel Admin - Destacar Máquina

```tsx
// admin/machines/[id].tsx
const toggleFeature = async (machineId: string, isFeatured: boolean) => {
  await fetch(`http://localhost:3000/api/admin/machines/${machineId}/feature`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isFeatured }),
  });
};

// Botão no painel
<Button onClick={() => toggleFeature(machine.id, !machine.isFeatured)}>
  {machine.isFeatured ? '⭐ Remover Destaque' : '⭐ Destacar'}
</Button>
```

## 📋 Resumo

### Backend (✅ Pronto)
- ✅ Campo `isFeatured` no banco de dados
- ✅ Endpoint PATCH `/api/admin/machines/:id/feature`
- ✅ Campo retorna em todos os endpoints de máquinas
- ✅ Apenas ADMIN pode destacar/remover destaque

### Frontend (❌ Precisa implementar)
- ❌ Badge "Destaque" no card da máquina
- ❌ Botão no painel admin para destacar/remover
- ❌ (Opcional) Filtro de máquinas em destaque
- ❌ (Opcional) Seção "Destaques" na home

## 🎯 Exemplo Completo

### 1. Admin destaca uma máquina
```bash
PATCH /api/admin/machines/abc123/feature
{ "isFeatured": true }
```

### 2. Máquina aparece com badge na listagem
```json
GET /api/machines
{
  "data": [
    {
      "id": "abc123",
      "name": "Trator XYZ",
      "isFeatured": true  // ← Badge "Destaque" aparece
    }
  ]
}
```

### 3. Front mostra o badge
```tsx
{machine.isFeatured && (
  <Badge variant="warning">⭐ Destaque</Badge>
)}
```

## 🚀 Pronto para usar!

O backend já está 100% pronto. Só falta o front implementar a UI do badge e o botão no painel admin! ⭐
