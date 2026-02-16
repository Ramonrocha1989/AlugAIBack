# Sistema de Planos - API Documentation

## Visão Geral

Sistema de planos implementado com dois níveis:
- **Free**: Até 3 anúncios ativos
- **Lojista**: Anúncios ilimitados + prioridade nas buscas

## Endpoints

### 1. Listar Planos Disponíveis

```http
GET /api/plans
```

**Autenticação**: Não requerida (público)

**Response**:
```json
[
  {
    "id": "free",
    "name": "Gratuito",
    "price": 0,
    "maxAds": 3,
    "features": [
      "Até 3 anúncios ativos",
      "5 fotos por anúncio",
      "Suporte por email"
    ]
  },
  {
    "id": "lojista",
    "name": "Lojista",
    "price": 299,
    "maxAds": -1,
    "features": [
      "Anúncios ilimitados",
      "15 fotos por anúncio",
      "Selo Vendedor Verificado",
      "Prioridade nas buscas",
      "Suporte prioritário"
    ]
  }
]
```

---

### 2. Listar Equipamentos (Modificado)

```http
GET /api/equipments
```

**Autenticação**: Bearer Token

**Query Parameters**:
- `location` (opcional): Filtrar por localização
- `minPrice` (opcional): Preço mínimo
- `maxPrice` (opcional): Preço máximo

**Ordenação Automática**:
1. Anúncios Premium primeiro
2. Anúncios de usuários Lojista
3. Anúncios de usuários Free
4. Mais recentes

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Escavadeira CAT 320",
    "description": "...",
    "pricePerDay": 450.00,
    "location": "São Paulo",
    "images": [],
    "isActive": true,
    "isPremium": true,
    "views": 45,
    "whatsappClicks": 12,
    "qualifiedLeads": 3,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "ownerPlan": "lojista",
    "company": {
      "id": "uuid",
      "name": "Empresa XYZ",
      "users": [
        {
          "id": "uuid",
          "name": "João Silva",
          "plan": "lojista"
        }
      ]
    }
  }
]
```

---

### 3. Detalhes do Equipamento (Modificado)

```http
GET /api/equipments/:id
```

**Autenticação**: Bearer Token

**Comportamento**: Incrementa automaticamente o contador de `views`

**Response**:
```json
{
  "id": "uuid",
  "name": "Escavadeira CAT 320",
  "description": "...",
  "pricePerDay": 450.00,
  "location": "São Paulo",
  "images": [],
  "isActive": true,
  "isPremium": false,
  "views": 46,
  "whatsappClicks": 12,
  "qualifiedLeads": 3,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "ownerPlan": "lojista",
  "company": {
    "id": "uuid",
    "name": "Empresa XYZ",
    "users": [
      {
        "id": "uuid",
        "name": "João Silva",
        "plan": "lojista"
      }
    ]
  }
}
```

---

### 4. Criar Equipamento (Modificado)

```http
POST /api/equipments
```

**Autenticação**: Bearer Token

**Validação**: Verifica limite de anúncios para usuários Free

**Request Body**:
```json
{
  "name": "Trator John Deere",
  "description": "Trator em excelente estado",
  "dailyPrice": 350.00,
  "location": "Campinas",
  "images": ["url1", "url2"]
}
```

**Response Success (201)**:
```json
{
  "id": "uuid",
  "name": "Trator John Deere",
  "description": "Trator em excelente estado",
  "pricePerDay": 350.00,
  "location": "Campinas",
  "images": ["url1", "url2"],
  "isActive": true,
  "isPremium": false,
  "views": 0,
  "whatsappClicks": 0,
  "qualifiedLeads": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "company": { ... }
}
```

**Response Error (403)**:
```json
{
  "statusCode": 403,
  "message": "Limite de anúncios atingido. Faça upgrade para o plano Lojista.",
  "error": "Forbidden"
}
```

---

### 5. Tracking de Cliques no WhatsApp (Novo)

```http
POST /api/equipments/:id/track-whatsapp
```

**Autenticação**: Bearer Token

**Descrição**: Incrementa o contador de cliques no botão WhatsApp

**Response**:
```json
{
  "message": "WhatsApp click tracked"
}
```

---

### 6. Marcar Lead Qualificado (Novo)

```http
POST /api/equipments/:id/mark-lead
```

**Autenticação**: Bearer Token

**Descrição**: Incrementa o contador de leads qualificados

**Response**:
```json
{
  "message": "Qualified lead marked"
}
```

---

## Campos Adicionados ao Banco

### Tabela `users`
- `plan` (VARCHAR): Plano do usuário ('free' ou 'lojista')
- `maxAds` (INTEGER): Limite de anúncios ativos

### Tabela `equipments`
- `isPremium` (BOOLEAN): Se o anúncio é premium
- `views` (INTEGER): Contador de visualizações
- `whatsappClicks` (INTEGER): Contador de cliques no WhatsApp
- `qualifiedLeads` (INTEGER): Contador de leads qualificados

---

## Regras de Negócio

### Limite de Anúncios
- **Free**: Máximo 3 anúncios ativos
- **Lojista**: Ilimitado

### Ordenação de Listagem
1. Anúncios com `isPremium = true`
2. Anúncios de usuários com `plan = 'lojista'`
3. Anúncios de usuários com `plan = 'free'`
4. Ordenação por data de criação (mais recentes primeiro)

### Tracking Automático
- Visualizações são incrementadas automaticamente ao acessar detalhes
- Cliques no WhatsApp devem ser rastreados pelo frontend
- Leads qualificados devem ser marcados pelo frontend

---

## Exemplos de Uso

### Verificar planos disponíveis
```bash
curl http://localhost:3000/api/plans
```

### Criar anúncio (com validação de limite)
```bash
curl -X POST http://localhost:3000/api/equipments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trator",
    "description": "Descrição do trator",
    "dailyPrice": 300,
    "location": "São Paulo"
  }'
```

### Rastrear clique no WhatsApp
```bash
curl -X POST http://localhost:3000/api/equipments/EQUIPMENT_ID/track-whatsapp \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Marcar lead qualificado
```bash
curl -X POST http://localhost:3000/api/equipments/EQUIPMENT_ID/mark-lead \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Próximos Passos

- [ ] Implementar upgrade de plano (integração com pagamento)
- [ ] Dashboard de métricas para usuários Lojista
- [ ] Sistema de anúncios premium (destaque)
- [ ] Relatórios de performance dos anúncios
