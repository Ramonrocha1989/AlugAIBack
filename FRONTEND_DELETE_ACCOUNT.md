# Integração Frontend - Exclusão de Conta

## React + TypeScript + React Query

### 1. Tipos TypeScript

```typescript
// types/auth.ts

export interface RequestDeleteDto {
  password: string;
}

export interface ConfirmDeleteDto {
  token: string;
}

export interface DeleteAccountResponse {
  message: string;
}
```

---

### 2. API Client

```typescript
// services/api.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const authApi = {
  requestDelete: async (data: RequestDeleteDto): Promise<DeleteAccountResponse> => {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_URL}/auth/request-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao solicitar exclusão');
    }

    return response.json();
  },

  confirmDelete: async (data: ConfirmDeleteDto): Promise<DeleteAccountResponse> => {
    const response = await fetch(`${API_URL}/auth/confirm-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao confirmar exclusão');
    }

    return response.json();
  },
};
```

---

### 3. React Query Hooks

```typescript
// hooks/useDeleteAccount.ts

import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { RequestDeleteDto, ConfirmDeleteDto } from '@/types/auth';

export const useRequestDelete = () => {
  return useMutation({
    mutationFn: (data: RequestDeleteDto) => authApi.requestDelete(data),
    onSuccess: () => {
      // Mostrar toast de sucesso
      console.log('Email de confirmação enviado');
    },
    onError: (error: Error) => {
      // Mostrar toast de erro
      console.error('Erro:', error.message);
    },
  });
};

export const useConfirmDelete = () => {
  return useMutation({
    mutationFn: (data: ConfirmDeleteDto) => authApi.confirmDelete(data),
    onSuccess: () => {
      // Limpar localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Redirecionar para home
      window.location.href = '/';
    },
    onError: (error: Error) => {
      console.error('Erro:', error.message);
    },
  });
};
```

---

### 4. Componente Modal de Confirmação

```typescript
// components/DeleteAccountModal.tsx

import { useState } from 'react';
import { useRequestDelete } from '@/hooks/useDeleteAccount';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  
  const { mutate: requestDelete, isPending } = useRequestDelete();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showWarning) {
      setShowWarning(true);
      return;
    }

    requestDelete({ password }, {
      onSuccess: () => {
        onClose();
        // Mostrar toast: "Email de confirmação enviado"
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          ⚠️ Excluir Conta
        </h2>

        {!showWarning ? (
          <>
            <p className="text-gray-700 mb-4">
              Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <h3 className="font-semibold text-red-800 mb-2">
                O que será excluído:
              </h3>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                <li>Seus equipamentos cadastrados</li>
                <li>Suas propostas e negociações</li>
                <li>Seu histórico de avaliações</li>
                <li>Todos os dados da sua conta</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="block mb-4">
                <span className="text-gray-700 font-medium">
                  Digite sua senha para continuar:
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  required
                  minLength={6}
                />
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Continuar
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="text-yellow-800 font-semibold mb-2">
                ⚠️ ÚLTIMA CONFIRMAÇÃO
              </p>
              <p className="text-yellow-700 text-sm">
                Você receberá um email com um link de confirmação. 
                Após clicar no link, sua conta será marcada para exclusão 
                e você terá 30 dias para recuperá-la entrando em contato 
                com o suporte.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowWarning(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Enviando...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

### 5. Página de Confirmação via Token

```typescript
// app/confirm-delete/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useConfirmDelete } from '@/hooks/useDeleteAccount';

export default function ConfirmDeletePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { mutate: confirmDelete } = useConfirmDelete();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    confirmDelete({ token }, {
      onSuccess: () => {
        setStatus('success');
      },
      onError: () => {
        setStatus('error');
      },
    });
  }, [token, confirmDelete]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processando exclusão...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-4 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Token Inválido ou Expirado
          </h1>
          <p className="text-gray-600 mb-6">
            O link de confirmação é inválido ou já expirou. 
            Por favor, solicite uma nova exclusão.
          </p>
          <a
            href="/profile"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar ao Perfil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Conta Marcada para Exclusão
        </h1>
        <p className="text-gray-600 mb-4">
          Sua conta foi marcada para exclusão e será removida 
          permanentemente em 30 dias.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Período de recuperação:</strong> 30 dias
            <br />
            <strong>Contato:</strong> suporte@mercadomaquina.online
          </p>
        </div>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Voltar à Home
        </a>
      </div>
    </div>
  );
}
```

---

### 6. Adicionar Botão no Perfil

```typescript
// app/profile/page.tsx

'use client';

import { useState } from 'react';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';

export default function ProfilePage() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>

      {/* Outros campos do perfil... */}

      {/* Zona de Perigo */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          Zona de Perigo
        </h2>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-gray-700 mb-4">
            Ao excluir sua conta, todos os seus dados serão removidos 
            permanentemente após 30 dias. Esta ação não pode ser desfeita.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Excluir Minha Conta
          </button>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
```

---

## Tailwind CSS (Opcional)

Se não estiver usando Tailwind, aqui estão os estilos CSS equivalentes:

```css
/* styles/delete-account.css */

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background-color: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 28rem;
  width: 100%;
  margin: 0 1rem;
}

.danger-zone {
  margin-top: 3rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 2rem;
}

.danger-box {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
}

.btn-danger {
  padding: 0.5rem 1rem;
  background-color: #dc2626;
  color: white;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
}

.btn-danger:hover {
  background-color: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Testes

```typescript
// __tests__/DeleteAccount.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteAccountModal } from '@/components/DeleteAccountModal';

describe('DeleteAccountModal', () => {
  it('should show warning before submitting', () => {
    render(<DeleteAccountModal isOpen={true} onClose={() => {}} />);
    
    const passwordInput = screen.getByLabelText(/digite sua senha/i);
    fireEvent.change(passwordInput, { target: { value: 'senha123' } });
    
    const continueButton = screen.getByText(/continuar/i);
    fireEvent.click(continueButton);
    
    expect(screen.getByText(/última confirmação/i)).toBeInTheDocument();
  });

  it('should call API on final confirmation', async () => {
    const mockRequestDelete = jest.fn();
    
    render(<DeleteAccountModal isOpen={true} onClose={() => {}} />);
    
    // Preencher senha
    const passwordInput = screen.getByLabelText(/digite sua senha/i);
    fireEvent.change(passwordInput, { target: { value: 'senha123' } });
    
    // Primeira confirmação
    fireEvent.click(screen.getByText(/continuar/i));
    
    // Segunda confirmação
    fireEvent.click(screen.getByText(/confirmar exclusão/i));
    
    await waitFor(() => {
      expect(mockRequestDelete).toHaveBeenCalledWith({ password: 'senha123' });
    });
  });
});
```

---

## Variáveis de Ambiente

```env
# .env.local

NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Pronto!

Agora você tem uma integração completa do sistema de exclusão de conta no frontend! 🎉
