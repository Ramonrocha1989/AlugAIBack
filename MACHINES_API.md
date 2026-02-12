# 🚜 API de Máquinas Agrícolas - Documentação

## ✅ IMPLEMENTAÇÃO COMPLETA

Sistema transformado de aluguel de equipamentos para marketplace de máquinas agrícolas e de construção.

---

## 📋 ENDPOINTS DISPONÍVEIS

### 1. **POST /api/machines** 🔒
Criar nova máquina (requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "businessType": "SALE",
  "name": "Trator John Deere 6125J",
  "description": "Trator com 3.200 horas, único dono, sempre em cultura de soja. Revisões em dia na autorizada. Pneus com 80% de vida útil. Cabine original com ar condicionado funcionando perfeitamente.",
  "category": "TRACTORS",
  "manufacturer": "John Deere",
  "model": "6125J",
  "yearModel": 2018,
  "power": 125,
  "engineHours": 3200,
  "serialNumber": "JD6125J2018BR001234",
  "price": 285000,
  "acceptsTradeDown": true,
  "acceptsTradeUp": false,
  "acceptsGrains": true,
  "acceptsFinancing": true,
  "state": "RS",
  "city": "Passo Fundo",
  "zipCode": "99010-000",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "videoUrl": "https://example.com/video.mp4",
  "quickTags": ["SINGLE_OWNER", "AUTHORIZED_SERVICE", "AIR_CONDITIONING"],
  "ownerPhone": "5554999887766"
}
```

---

### 2. **GET /api/machines**
Listar máquinas com filtros (público)

**Query Parameters:**

**Filtros Básicos:**
- `search` - Busca em nome, descrição, fabricante, modelo
- `category` - TRACTORS | HARVESTERS | PLANTING | SPRAYING | HAYMAKING | IMPLEMENTS | LIVESTOCK | CONSTRUCTION
- `businessType` - SALE | RENTAL | EXCHANGE | SERVICE
- `manufacturer` - Nome do fabricante
- `state` - UF (2 caracteres)
- `city` - Nome da cidade

**Filtros Técnicos (⭐ DIFERENCIAIS):**
- `minPrice` / `maxPrice` - Faixa de preço
- `minYear` / `maxYear` - Faixa de ano
- `minEngineHours` / `maxEngineHours` - ⭐ Faixa de horas de motor
- `minPower` / `maxPower` - Faixa de potência (CV)

**Filtros Booleanos:**
- `acceptsTradeDown=true` - Aceita troca por menor valor
- `acceptsTradeUp=true` - Aceita troca por maior valor
- `acceptsGrains=true` - Aceita grãos como pagamento
- `isVerifiedSeller=true` - Apenas vendedores verificados

**Paginação:**
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 20, máx: 100)

**Exemplos:**

```bash
# Tratores no RS com até 5000 horas
GET /api/machines?category=TRACTORS&state=RS&maxEngineHours=5000

# Máquinas para venda que aceitam troca
GET /api/machines?businessType=SALE&acceptsTradeDown=true

# Busca por "John Deere" com preço até R$ 300.000
GET /api/machines?search=John%20Deere&maxPrice=300000

# Colheitadeiras de 2018 a 2023
GET /api/machines?category=HARVESTERS&minYear=2018&maxYear=2023
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "businessType": "SALE",
      "name": "Trator John Deere 6125J",
      "category": "TRACTORS",
      "manufacturer": "John Deere",
      "model": "6125J",
      "yearModel": 2018,
      "power": 125,
      "engineHours": 3200,
      "price": "285000.00",
      "state": "RS",
      "city": "Passo Fundo",
      "images": ["url1", "url2"],
      "quickTags": ["SINGLE_OWNER"],
      "views": 42,
      "createdAt": "2024-02-12T12:00:00Z",
      "owner": {
        "id": "uuid",
        "name": "João Silva"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### 3. **GET /api/machines/my** 🔒
Listar minhas máquinas (requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta:** Array de máquinas do usuário logado

---

### 4. **GET /api/machines/:id**
Buscar máquina por ID (público)

**Exemplo:**
```bash
GET /api/machines/550e8400-e29b-41d4-a716-446655440000
```

---

### 5. **POST /api/machines/:id/view**
Incrementar contador de visualizações (público)

**Exemplo:**
```bash
POST /api/machines/550e8400-e29b-41d4-a716-446655440000/view
```

**Resposta:**
```json
{
  "message": "Visualização registrada"
}
```

---

### 6. **PUT /api/machines/:id** 🔒
Atualizar máquina (requer autenticação, apenas dono)

**Headers:**
```
Authorization: Bearer {token}
```

**Body:** Qualquer campo do CreateMachineSchema (todos opcionais)

---

### 7. **DELETE /api/machines/:id** 🔒
Deletar máquina (requer autenticação, apenas dono)

**Headers:**
```
Authorization: Bearer {token}
```

---

## 🎯 CATEGORIAS DISPONÍVEIS

| Enum | Descrição |
|------|-----------|
| `TRACTORS` | Tratores |
| `HARVESTERS` | Colheitadeiras |
| `PLANTING` | Plantio e Semeadura |
| `SPRAYING` | Pulverização |
| `HAYMAKING` | Fenação e Silagem |
| `IMPLEMENTS` | Implementos e Acoplados |
| `LIVESTOCK` | Pecuária e Outros |
| `CONSTRUCTION` | Construção (Linha Amarela) |

---

## 💼 TIPOS DE NEGÓCIO

| Enum | Descrição |
|------|-----------|
| `SALE` | Venda |
| `RENTAL` | Aluguel |
| `EXCHANGE` | Troca |
| `SERVICE` | Serviço com a máquina |

---

## 🏷️ TAGS RÁPIDAS

| Enum | Descrição |
|------|-----------|
| `NEW_TIRES` | Pneus Novos |
| `ORIGINAL_CABIN` | Cabine Original |
| `AUTHORIZED_SERVICE` | Revisado na Autorizada |
| `GPS_INTEGRATED` | GPS Integrado |
| `AIR_CONDITIONING` | Ar Condicionado |
| `SINGLE_OWNER` | Único Dono |
| `COMPLETE_DOCS` | Documentação Completa |

---

## ✅ VALIDAÇÕES IMPLEMENTADAS

### Campos Obrigatórios:
- ✅ businessType, name (min 5), description (min 50)
- ✅ category, manufacturer, model
- ✅ yearModel (1980 até ano atual + 1)
- ✅ price (> 0)
- ✅ state (2 caracteres UF), city
- ✅ images (mínimo 1, máximo 10, URLs válidas)

### Validações Específicas:
- ✅ engineHours >= 0
- ✅ power > 0
- ✅ ownerPhone: formato brasileiro (55 + DDD + número)
- ✅ state: uppercase automático
- ✅ URLs validadas para images e videoUrl

---

## 🗄️ BANCO DE DADOS

### Tabela: `machines`

**Índices criados para performance:**
- category
- businessType
- state, city
- manufacturer
- yearModel
- engineHours ⭐
- power
- ownerId
- price

---

## 🚀 COMO TESTAR

### 1. Criar uma máquina:
```bash
curl -X POST http://localhost:3000/api/machines \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "SALE",
    "name": "Trator Valtra BH180",
    "description": "Trator 4x4 com 180cv, apenas 1.500 horas de uso. Sempre guardado em galpão. Pneus novos, cabine climatizada, GPS integrado. Aceito trator menor como parte do pagamento.",
    "category": "TRACTORS",
    "manufacturer": "Valtra",
    "model": "BH180",
    "yearModel": 2020,
    "power": 180,
    "engineHours": 1500,
    "price": 450000,
    "acceptsTradeDown": true,
    "acceptsGrains": true,
    "state": "RS",
    "city": "Ijuí",
    "images": ["https://via.placeholder.com/800x600"],
    "quickTags": ["NEW_TIRES", "GPS_INTEGRATED", "SINGLE_OWNER"]
  }'
```

### 2. Listar tratores no RS:
```bash
curl "http://localhost:3000/api/machines?category=TRACTORS&state=RS"
```

### 3. Buscar por horas de motor:
```bash
curl "http://localhost:3000/api/machines?maxEngineHours=3000&minPower=100"
```

---

## 📊 DIFERENCIAL COMPETITIVO

### ⭐ Filtro por Horas de Motor
O campo `engineHours` é indexado e permite filtros precisos:
- Máquinas com baixa utilização (0-2000h)
- Uso moderado (2000-5000h)
- Alto uso (5000h+)

### 🔍 Busca Inteligente
Busca simultânea em:
- Nome da máquina
- Descrição
- Fabricante
- Modelo

### 🎯 Filtros Combinados
Exemplo: "Tratores John Deere no RS, até 5000 horas, que aceitam troca"
```
?category=TRACTORS&manufacturer=John%20Deere&state=RS&maxEngineHours=5000&acceptsTradeDown=true
```

---

## 🎉 IMPLEMENTAÇÃO CONCLUÍDA

✅ Modelo Machine com 30+ campos
✅ 7 endpoints funcionais
✅ 15+ filtros implementados
✅ Validações Zod completas
✅ Índices de performance
✅ Paginação
✅ Autenticação JWT
✅ Documentação Swagger

**Acesse:** http://localhost:3000/api/docs
