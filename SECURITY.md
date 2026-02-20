# 🔒 Segurança Implementada

## ✅ O que foi feito

### Backend
- ✅ JWT em cookies httpOnly (proteção XSS)
- ✅ CSRF protection
- ✅ Rate limiting (5 tentativas login/15min)
- ✅ HSTS + Security headers
- ✅ Validação global com whitelist
- ✅ **Dados sensíveis removidos do login** (LGPD/GDPR compliant)

### Novos Endpoints
- `GET /api/auth/csrf-token` - Obter token CSRF
- `POST /api/auth/logout` - Logout com limpeza de cookie
- `GET /api/auth/me` - Perfil completo (incluindo dados sensíveis)

---

## 🔐 Proteção de Dados Sensíveis

### ✅ Login/Register retorna APENAS:
- `id`, `name`, `email`, `role`
- `plan`, `emailVerified`, `isVerifiedSeller`
- `maxAds`, `maxPremiumAds`, `maxFeaturedAds`
- `company.id`, `company.name`
- `usage` (contadores)

### ❌ NÃO retorna no login:
- `phone` (LGPD)
- `company.document` (LGPD)
- Qualquer PII (Personally Identifiable Information)

### 🔓 Dados sensíveis via `/auth/me`:
Endpoint protegido que retorna perfil completo:
- `phone`
- `company.document`
- Todos os dados do usuário

**Benefícios:**
- ✅ LGPD/GDPR Compliance
- ✅ Menos dados expostos no localStorage
- ✅ Dados sensíveis só via API autenticada

---

## 🧪 Testar

```bash
./test-security-implementation.sh
```

Ou manualmente:
```bash
# CSRF Token
curl http://localhost:3000/api/auth/csrf-token

# Login sem CSRF (deve falhar com 403)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

---

## 🎨 Atualizar Frontend

### 1. Criar helper de API (`lib/api.ts`)

```typescript
const API_URL = 'http://localhost:3000/api';
let csrfToken: string | null = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_URL}/auth/csrf-token`, { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const method = options.method?.toUpperCase() || 'GET';
  
  let headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    headers['X-CSRF-Token'] = await getCsrfToken();
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // IMPORTANTE!
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export function clearCsrfToken() {
  csrfToken = null;
}
```

### 2. Atualizar hooks

```typescript
// Login
export function useLogin() {
  return useMutation({
    mutationFn: (data) => apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  });
}

// Logout
export function useLogout() {
  return useMutation({
    mutationFn: () => apiRequest('/auth/logout', { method: 'POST' }),
    onSuccess: () => clearCsrfToken(),
  });
}

// Current User
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiRequest('/auth/me'),
  });
}
```

### 3. Remover localStorage

```typescript
// ❌ REMOVER
localStorage.setItem('token', token);
localStorage.getItem('token');

// ✅ Cookie é gerenciado automaticamente
```

---

## 🚀 Deploy

Variáveis de ambiente em produção:
```env
NODE_ENV=production
JWT_SECRET=sua_chave_super_secreta_aqui
FRONTEND_URL=https://seu-dominio.com
```

---

## 📊 Proteções

| Vulnerabilidade | Status |
|----------------|--------|
| XSS | ✅ Cookie httpOnly |
| CSRF | ✅ Token obrigatório |
| Brute Force | ✅ Rate limiting |
| MITM | ✅ HSTS + Secure cookies |
| LGPD/GDPR | ✅ Dados sensíveis protegidos |

---

**Pronto!** Backend seguro e documentado.
