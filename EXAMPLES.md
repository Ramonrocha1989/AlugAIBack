# 📝 EXEMPLOS PRÁTICOS - API de Máquinas

## 🔍 CASOS DE USO REAIS

### 1. Buscar tratores no RS com até 5000 horas
```bash
curl "http://localhost:3000/api/machines?category=TRACTORS&state=RS&maxEngineHours=5000"
```

### 2. Colheitadeiras para venda que aceitam troca
```bash
curl "http://localhost:3000/api/machines?category=HARVESTERS&businessType=SALE&acceptsTradeDown=true"
```

### 3. Máquinas em Passo Fundo até R$ 300.000
```bash
curl "http://localhost:3000/api/machines?city=Passo%20Fundo&maxPrice=300000"
```

### 4. Buscar "John Deere" com potência acima de 100cv
```bash
curl "http://localhost:3000/api/machines?search=John%20Deere&minPower=100"
```

### 5. Máquinas de 2018 a 2023 que aceitam grãos
```bash
curl "http://localhost:3000/api/machines?minYear=2018&maxYear=2023&acceptsGrains=true"
```

### 6. Apenas vendedores verificados no Sul
```bash
curl "http://localhost:3000/api/machines?isVerifiedSeller=true&state=RS"
```

### 7. Paginação - Página 2 com 10 itens
```bash
curl "http://localhost:3000/api/machines?page=2&limit=10"
```

---

## 🎯 FILTROS COMBINADOS AVANÇADOS

### Caso 1: Trator ideal para pequeno produtor
```bash
# Tratores até R$ 200k, até 3000h, que aceitam troca
curl "http://localhost:3000/api/machines?\
category=TRACTORS&\
maxPrice=200000&\
maxEngineHours=3000&\
acceptsTradeDown=true&\
state=RS"
```

### Caso 2: Colheitadeira recente e potente
```bash
# Colheitadeiras 2020+, acima de 200cv, vendedores verificados
curl "http://localhost:3000/api/machines?\
category=HARVESTERS&\
minYear=2020&\
minPower=200&\
isVerifiedSeller=true"
```

### Caso 3: Máquinas para construção no PR
```bash
# Linha amarela, até 10000h, aceita financiamento
curl "http://localhost:3000/api/machines?\
category=CONSTRUCTION&\
state=PR&\
maxEngineHours=10000&\
acceptsFinancing=true"
```

---

## 📊 CATEGORIAS E VALORES

### Categorias (category):
- `TRACTORS` - Tratores
- `HARVESTERS` - Colheitadeiras
- `PLANTING` - Plantio e Semeadura
- `SPRAYING` - Pulverização
- `HAYMAKING` - Fenação e Silagem
- `IMPLEMENTS` - Implementos e Acoplados
- `LIVESTOCK` - Pecuária e Outros
- `CONSTRUCTION` - Construção (Linha Amarela)

### Tipos de Negócio (businessType):
- `SALE` - Venda
- `RENTAL` - Aluguel
- `EXCHANGE` - Troca
- `SERVICE` - Serviço com a máquina

### Tags Rápidas (quickTags):
- `NEW_TIRES` - Pneus Novos
- `ORIGINAL_CABIN` - Cabine Original
- `AUTHORIZED_SERVICE` - Revisado na Autorizada
- `GPS_INTEGRATED` - GPS Integrado
- `AIR_CONDITIONING` - Ar Condicionado
- `SINGLE_OWNER` - Único Dono
- `COMPLETE_DOCS` - Documentação Completa

### Estados do Sul:
- `RS` - Rio Grande do Sul
- `SC` - Santa Catarina
- `PR` - Paraná

---

## 🔐 CRIAR MÁQUINA (Autenticado)

### 1. Fazer Login
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "suasenha"
  }' | jq -r '.access_token')
```

### 2. Criar Máquina
```bash
curl -X POST http://localhost:3000/api/machines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "SALE",
    "name": "Trator Valtra BH180 4x4",
    "description": "Trator 4x4 com 180cv, apenas 1.500 horas de uso. Sempre guardado em galpão. Pneus novos, cabine climatizada, GPS integrado. Aceito trator menor como parte do pagamento. Máquina impecável, pronta para trabalhar.",
    "category": "TRACTORS",
    "manufacturer": "Valtra",
    "model": "BH180",
    "yearModel": 2020,
    "power": 180,
    "engineHours": 1500,
    "price": 450000,
    "acceptsTradeDown": true,
    "acceptsTradeUp": false,
    "acceptsGrains": true,
    "acceptsFinancing": true,
    "state": "RS",
    "city": "Ijuí",
    "zipCode": "98700-000",
    "images": [
      "https://via.placeholder.com/800x600/0066cc/ffffff?text=Trator+Frente",
      "https://via.placeholder.com/800x600/0066cc/ffffff?text=Trator+Lateral",
      "https://via.placeholder.com/800x600/0066cc/ffffff?text=Cabine"
    ],
    "videoUrl": "https://www.youtube.com/watch?v=example",
    "quickTags": ["NEW_TIRES", "GPS_INTEGRATED", "SINGLE_OWNER", "AIR_CONDITIONING"],
    "ownerPhone": "5555999887766"
  }'
```

### 3. Listar Minhas Máquinas
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/machines/my
```

### 4. Atualizar Máquina
```bash
curl -X PUT http://localhost:3000/api/machines/{ID} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 440000,
    "description": "PREÇO REDUZIDO! Trator 4x4 com 180cv..."
  }'
```

### 5. Deletar Máquina
```bash
curl -X DELETE http://localhost:3000/api/machines/{ID} \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📈 INCREMENTAR VISUALIZAÇÕES

```bash
# Público - não requer autenticação
curl -X POST http://localhost:3000/api/machines/{ID}/view
```

---

## 🎯 DICAS DE PERFORMANCE

1. **Use filtros específicos** para reduzir o volume de dados
2. **Combine múltiplos filtros** para buscas precisas
3. **Use paginação** para grandes volumes (limit máximo: 100)
4. **Índices otimizados** para: category, state, engineHours, power, price

---

## ✅ VALIDAÇÕES

### Campos Obrigatórios:
- Nome: mínimo 5 caracteres
- Descrição: mínimo 50 caracteres
- Ano: entre 1980 e ano atual + 1
- Preço: maior que zero
- Estado: 2 caracteres (UF)
- Imagens: mínimo 1, máximo 10 (URLs válidas)

### Validações Específicas:
- engineHours: >= 0
- power: > 0
- ownerPhone: formato brasileiro (5551999887766)
- state: convertido para maiúsculas automaticamente

---

## 🚀 PRONTO PARA USAR!

Todos os exemplos acima estão funcionando e prontos para serem testados!
