/**
 * Script para testar o ciclo completo de assinatura via webhooks simulados.
 *
 * Uso: npx ts-node scripts/test-subscription-cycle.ts
 *
 * Pré-requisitos:
 *   - Servidor rodando em localhost:3000
 *   - Usuário de teste já cadastrado no banco
 *   - Variável MERCADOPAGO_WEBHOOK_SECRET não validada em dev (ou desabilitar temporariamente)
 *
 * O que testa:
 *   1. Webhook subscription_preapproval (action: created)  → ativa plano + salva subscriptionId
 *   2. Webhook subscription_preapproval (action: payment)  → renova planExpiresAt +30 dias
 *   3. Webhook subscription_preapproval (action: updated, status: cancelled) → rebaixa para free
 */

const BASE_URL = 'http://localhost:3000/api';

// ⚠️ Substitua pelo userId e planId reais do seu banco de teste
const TEST_USER_ID = 'SEU_USER_ID_AQUI';
const TEST_PLAN_ID = 'lojista';
const FAKE_SUBSCRIPTION_ID = 'fake-sub-' + Date.now();

async function sendWebhook(body: any) {
  const res = await fetch(`${BASE_URL}/webhooks/mercadopago`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

async function getUser(token: string) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function run() {
  console.log('=== Teste do ciclo de assinatura ===\n');
  console.log(`userId: ${TEST_USER_ID}`);
  console.log(`planId: ${TEST_PLAN_ID}`);
  console.log(`subscriptionId: ${FAKE_SUBSCRIPTION_ID}\n`);

  // Nota: Em dev, desabilite a validação de assinatura do webhook
  // ou esses testes vão retornar 401.

  console.log('1️⃣  Simulando ativação (subscription_preapproval + action: created)...');
  const r1 = await sendWebhook({
    type: 'subscription_preapproval',
    action: 'created',
    data: { id: FAKE_SUBSCRIPTION_ID },
  });
  console.log(`   Response: ${r1.status}`, r1.body);

  console.log('\n2️⃣  Simulando renovação (subscription_preapproval + action: payment)...');
  const r2 = await sendWebhook({
    type: 'subscription_preapproval',
    action: 'payment',
    data: { id: FAKE_SUBSCRIPTION_ID },
  });
  console.log(`   Response: ${r2.status}`, r2.body);

  console.log('\n3️⃣  Simulando cancelamento (subscription_preapproval + action: updated, status: cancelled)...');
  const r3 = await sendWebhook({
    type: 'subscription_preapproval',
    action: 'updated',
    data: { id: FAKE_SUBSCRIPTION_ID },
  });
  console.log(`   Response: ${r3.status}`, r3.body);

  console.log('\n=== Fim do teste ===');
  console.log('Verifique os logs do servidor e o banco para confirmar:');
  console.log('  - Passo 1: user.plan = lojista, user.subscriptionId = ' + FAKE_SUBSCRIPTION_ID);
  console.log('  - Passo 2: user.planExpiresAt renovado +30 dias');
  console.log('  - Passo 3: user.plan = free, user.subscriptionId = null');
}

run().catch(console.error);
