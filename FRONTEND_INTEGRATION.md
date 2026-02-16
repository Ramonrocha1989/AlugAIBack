# 🎨 Guia de Integração Frontend - Sistema de Planos

## 📋 Visão Geral

Este guia mostra como integrar o sistema de planos no frontend usando React Query.

---

## 🔌 Endpoints Disponíveis

### 1. Listar Planos (Público)
```typescript
// hooks/usePlans.ts
import { useQuery } from '@tanstack/react-query';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await fetch('http://localhost:3000/api/plans');
      return response.json();
    },
  });
}
```

### 2. Listar Equipamentos (com ordenação por plano)
```typescript
// hooks/useEquipments.ts
import { useQuery } from '@tanstack/react-query';

export function useEquipments(filters?: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  return useQuery({
    queryKey: ['equipments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.location) params.append('location', filters.location);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

      const response = await fetch(
        `http://localhost:3000/api/equipments?${params}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      return response.json();
    },
  });
}
```

### 3. Criar Equipamento (com validação de limite)
```typescript
// hooks/useCreateEquipment.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      dailyPrice: number;
      location: string;
      images?: string[];
    }) => {
      const response = await fetch('http://localhost:3000/api/equipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
    },
    onError: (error: Error) => {
      // Mostrar mensagem de erro ao usuário
      if (error.message.includes('Limite de anúncios atingido')) {
        // Redirecionar para página de upgrade
        window.location.href = '/upgrade';
      }
    },
  });
}
```

### 4. Rastrear Clique no WhatsApp
```typescript
// hooks/useTrackWhatsapp.ts
import { useMutation } from '@tanstack/react-query';

export function useTrackWhatsapp() {
  return useMutation({
    mutationFn: async (equipmentId: string) => {
      const response = await fetch(
        `http://localhost:3000/api/equipments/${equipmentId}/track-whatsapp`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      return response.json();
    },
  });
}
```

### 5. Marcar Lead Qualificado
```typescript
// hooks/useMarkLead.ts
import { useMutation } from '@tanstack/react-query';

export function useMarkLead() {
  return useMutation({
    mutationFn: async (equipmentId: string) => {
      const response = await fetch(
        `http://localhost:3000/api/equipments/${equipmentId}/mark-lead`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      return response.json();
    },
  });
}
```

---

## 🎨 Componentes de Exemplo

### Página de Planos
```tsx
// pages/plans.tsx
import { usePlans } from '@/hooks/usePlans';

export default function PlansPage() {
  const { data: plans, isLoading } = usePlans();

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {plans?.map((plan) => (
        <div key={plan.id} className="border rounded-lg p-6">
          <h2 className="text-2xl font-bold">{plan.name}</h2>
          <p className="text-3xl font-bold mt-4">
            {plan.price === 0 ? 'Gratuito' : `R$ ${plan.price}/mês`}
          </p>
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <button className="mt-6 w-full bg-blue-600 text-white py-2 rounded">
            {plan.id === 'free' ? 'Plano Atual' : 'Fazer Upgrade'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Card de Equipamento (com badge de plano)
```tsx
// components/EquipmentCard.tsx
interface EquipmentCardProps {
  equipment: {
    id: string;
    name: string;
    pricePerDay: number;
    location: string;
    images: string[];
    isPremium: boolean;
    ownerPlan: 'free' | 'lojista';
    views: number;
    whatsappClicks: number;
  };
}

export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const trackWhatsapp = useTrackWhatsapp();

  const handleWhatsappClick = () => {
    trackWhatsapp.mutate(equipment.id);
    // Abrir WhatsApp
    window.open(`https://wa.me/5511999999999`, '_blank');
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Badge de Premium */}
      {equipment.isPremium && (
        <div className="bg-yellow-500 text-white px-3 py-1 text-sm font-bold">
          ⭐ PREMIUM
        </div>
      )}

      {/* Badge de Lojista */}
      {equipment.ownerPlan === 'lojista' && (
        <div className="bg-blue-500 text-white px-3 py-1 text-sm">
          ✓ Vendedor Verificado
        </div>
      )}

      <img
        src={equipment.images[0] || '/placeholder.jpg'}
        alt={equipment.name}
        className="w-full h-48 object-cover"
      />

      <div className="p-4">
        <h3 className="text-xl font-bold">{equipment.name}</h3>
        <p className="text-gray-600">{equipment.location}</p>
        <p className="text-2xl font-bold mt-2">
          R$ {equipment.pricePerDay}/dia
        </p>

        {/* Métricas */}
        <div className="flex gap-4 mt-4 text-sm text-gray-600">
          <span>👁️ {equipment.views} visualizações</span>
          <span>💬 {equipment.whatsappClicks} contatos</span>
        </div>

        <button
          onClick={handleWhatsappClick}
          className="mt-4 w-full bg-green-600 text-white py-2 rounded"
        >
          💬 Entrar em Contato
        </button>
      </div>
    </div>
  );
}
```

### Formulário de Criar Anúncio (com validação)
```tsx
// components/CreateEquipmentForm.tsx
import { useCreateEquipment } from '@/hooks/useCreateEquipment';
import { useState } from 'react';

export function CreateEquipmentForm() {
  const createEquipment = useCreateEquipment();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dailyPrice: 0,
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createEquipment.mutateAsync(formData);
      alert('Anúncio criado com sucesso!');
    } catch (error) {
      if (error.message.includes('Limite de anúncios atingido')) {
        // Mostrar modal de upgrade
        setShowUpgradeModal(true);
      } else {
        alert('Erro ao criar anúncio');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nome do equipamento"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full border rounded px-4 py-2"
      />
      
      <textarea
        placeholder="Descrição"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full border rounded px-4 py-2"
      />
      
      <input
        type="number"
        placeholder="Preço por dia"
        value={formData.dailyPrice}
        onChange={(e) => setFormData({ ...formData, dailyPrice: Number(e.target.value) })}
        className="w-full border rounded px-4 py-2"
      />
      
      <input
        type="text"
        placeholder="Localização"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        className="w-full border rounded px-4 py-2"
      />
      
      <button
        type="submit"
        disabled={createEquipment.isPending}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {createEquipment.isPending ? 'Criando...' : 'Criar Anúncio'}
      </button>
    </form>
  );
}
```

### Modal de Upgrade
```tsx
// components/UpgradeModal.tsx
export function UpgradeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md">
        <h2 className="text-2xl font-bold mb-4">Limite de Anúncios Atingido</h2>
        <p className="text-gray-600 mb-6">
          Você atingiu o limite de 3 anúncios do plano gratuito.
          Faça upgrade para o plano Lojista e tenha anúncios ilimitados!
        </p>
        
        <div className="bg-blue-50 p-4 rounded mb-6">
          <h3 className="font-bold text-lg">Plano Lojista</h3>
          <p className="text-3xl font-bold text-blue-600 my-2">R$ 299/mês</p>
          <ul className="space-y-1 text-sm">
            <li>✓ Anúncios ilimitados</li>
            <li>✓ Selo Vendedor Verificado</li>
            <li>✓ Prioridade nas buscas</li>
            <li>✓ Suporte prioritário</li>
          </ul>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={() => window.location.href = '/upgrade'}
            className="flex-1 bg-blue-600 text-white py-2 rounded"
          >
            Fazer Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Fluxos de Usuário

### Fluxo 1: Usuário Free tenta criar 4º anúncio
```
1. Usuário preenche formulário
2. Clica em "Criar Anúncio"
3. Backend retorna erro 403
4. Frontend mostra modal de upgrade
5. Usuário pode:
   - Cancelar e voltar
   - Fazer upgrade para Lojista
```

### Fluxo 2: Visualizar equipamento
```
1. Usuário clica em um equipamento
2. Backend incrementa views automaticamente
3. Frontend exibe detalhes + métricas
4. Usuário vê: views, whatsappClicks, qualifiedLeads
```

### Fluxo 3: Contato via WhatsApp
```
1. Usuário clica em "Entrar em Contato"
2. Frontend chama POST /track-whatsapp
3. Backend incrementa contador
4. Frontend abre WhatsApp
```

---

## 📊 Exibição de Badges

### Badge Premium
```tsx
{equipment.isPremium && (
  <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">
    ⭐ PREMIUM
  </span>
)}
```

### Badge Lojista
```tsx
{equipment.ownerPlan === 'lojista' && (
  <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
    ✓ Vendedor Verificado
  </span>
)}
```

### Badge Free
```tsx
{equipment.ownerPlan === 'free' && (
  <span className="bg-gray-400 text-white px-2 py-1 rounded text-xs">
    Plano Gratuito
  </span>
)}
```

---

## 🔔 Notificações

### Limite Atingido
```tsx
if (error.message.includes('Limite de anúncios atingido')) {
  toast.error('Você atingiu o limite de 3 anúncios. Faça upgrade!', {
    action: {
      label: 'Upgrade',
      onClick: () => router.push('/upgrade'),
    },
  });
}
```

---

## 📈 Dashboard de Métricas (para Lojistas)

```tsx
// pages/dashboard.tsx
export default function Dashboard() {
  const { data: myEquipments } = useMyEquipments();

  const totalViews = myEquipments?.reduce((sum, eq) => sum + eq.views, 0);
  const totalClicks = myEquipments?.reduce((sum, eq) => sum + eq.whatsappClicks, 0);
  const totalLeads = myEquipments?.reduce((sum, eq) => sum + eq.qualifiedLeads, 0);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600">Total de Visualizações</h3>
        <p className="text-4xl font-bold">{totalViews}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600">Cliques no WhatsApp</h3>
        <p className="text-4xl font-bold">{totalClicks}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600">Leads Qualificados</h3>
        <p className="text-4xl font-bold">{totalLeads}</p>
      </div>
    </div>
  );
}
```

---

## ✅ Checklist de Integração Frontend

- [ ] Criar hooks para todos os endpoints
- [ ] Implementar página de planos
- [ ] Adicionar badges de plano nos cards
- [ ] Implementar modal de upgrade
- [ ] Adicionar tracking de WhatsApp
- [ ] Criar dashboard de métricas
- [ ] Implementar validação de limite
- [ ] Adicionar notificações de erro
- [ ] Testar fluxo completo

---

**Pronto para integrar! 🚀**
