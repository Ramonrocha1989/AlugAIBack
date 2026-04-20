import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Payment, MerchantOrder } from 'mercadopago';
import { createHmac } from 'crypto';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private client: MercadoPagoConfig;

  constructor(private prisma: PrismaService) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });
  }

  validateSignature(xSignature: string, xRequestId: string, dataId: string) {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('MERCADOPAGO_WEBHOOK_SECRET não configurado');
    }

    if (!xSignature || !xRequestId) {
      throw new Error('Headers de assinatura ausentes');
    }

    const parts = xSignature.split(',');
    let ts = '';
    let hash = '';

    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key.trim() === 'ts') ts = value.trim();
      if (key.trim() === 'v1') hash = value.trim();
    });

    if (!ts || !hash) {
      throw new Error('Formato de assinatura inválido');
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const hmac = createHmac('sha256', secret).update(manifest).digest('hex');

    if (hmac !== hash) {
      this.logger.warn('Assinatura inválida do webhook');
      throw new Error('Assinatura inválida');
    }

    this.logger.log('✅ Assinatura do webhook validada');
  }

  async handleMercadoPagoWebhook(body: any) {
    this.logger.log(`Webhook recebido: type=${body.type}, action=${body.action}`);

    if (body.type === 'payment') {
      await this.processPayment(body.data?.id);
    } else if (body.type === 'topic_merchant_order_wh' || body.type === 'merchant_order') {
      await this.processMerchantOrder(body.data?.id || body.id);
    } else if (body.type === 'subscription_preapproval' && body.action === 'updated') {
      await this.processSubscriptionUpdate(body.data?.id);
    }
  }

  private async processPayment(paymentId: string) {
    if (!paymentId) return;

    try {
      const payment = new Payment(this.client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status !== 'approved') {
        this.logger.log(`Pagamento ${paymentId} com status: ${paymentData.status}`);
        return;
      }

      await this.activatePlan(paymentData.external_reference || '', paymentId);
    } catch (error: any) {
      this.logger.error(`Erro ao processar pagamento ${paymentId}: ${error.message}`);
    }
  }

  private async processMerchantOrder(orderId: string) {
    if (!orderId) return;

    try {
      const merchantOrder = new MerchantOrder(this.client);
      const orderData = await merchantOrder.get({ merchantOrderId: orderId });

      this.logger.log(`Merchant order ${orderId}: status=${orderData.status}, payments=${JSON.stringify(orderData.payments?.map(p => ({ id: p.id, status: p.status })))}`);

      if (orderData.status !== 'closed') return;

      const approvedPayment = orderData.payments?.find(p => p.status === 'approved');
      if (!approvedPayment) return;

      await this.activatePlan(orderData.external_reference || '', approvedPayment.id?.toString() || '');
    } catch (error: any) {
      this.logger.error(`Erro ao processar merchant order ${orderId}: ${error.message}`);
    }
  }

  private async processSubscriptionUpdate(subscriptionId: string) {
    if (!subscriptionId) return;

    try {
      // Buscar dados da assinatura via API do Mercado Pago
      const response = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        { headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` } },
      );
      const subscription = await response.json() as any;

      const cancelledStatuses = ['cancelled', 'paused'];
      if (!cancelledStatuses.includes(subscription.status)) return;

      const externalReference = subscription.external_reference;
      if (!externalReference) return;

      const parts = externalReference.split('|');
      const userId = parts[0];

      if (!userId) return;

      this.logger.log(`Assinatura ${subscriptionId} cancelada/pausada — rebaixando usuário ${userId}`);
      await this.onPlanCancelled(userId);
    } catch (error: any) {
      this.logger.error(`Erro ao processar cancelamento de assinatura ${subscriptionId}: ${error.message}`);
    }
  }

  private async activatePlan(externalReference: string, paymentId: string) {
    if (!externalReference) {
      this.logger.warn(`Pagamento ${paymentId} sem external_reference`);
      return;
    }

    const parts = externalReference.split('|');
    const userId = parts[0];
    const planType = parts[1];

    if (!userId || !planType) {
      this.logger.error(`External reference inválido: ${externalReference}`);
      return;
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: planType } });
    if (!plan) {
      this.logger.error(`Plano não encontrado: ${planType}`);
      return;
    }

    await this.prisma.payment.create({
      data: {
        userId,
        planId: planType,
        mercadoPagoId: paymentId,
        externalReference,
        amount: plan.price,
        status: 'approved',
        webhookType: 'plan_activation',
      },
    });

    this.logger.log(`💰 Pagamento registrado: user=${userId}, plan=${planType}, mpId=${paymentId}`);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: planType,
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxAds: plan.maxAds,
        maxPremiumAds: plan.maxPremiumAds,
        maxFeaturedAds: plan.maxFeaturedAds,
      },
    });

    // Remover expiração das máquinas ativas (plano pago = sem expiração)
    if (plan.adDuration === -1) {
      await this.prisma.machine.updateMany({
        where: { ownerId: userId, status: 'ACTIVE', available: true },
        data: { expiresAt: null },
      });
    }

    this.logger.log(`✅ Plano ${planType} ativado para usuário ${userId}`);
  }

  async onPlanCancelled(userId: string) {
    const FREE_LIMIT = 2;

    const machines = await this.prisma.machine.findMany({
      where: { ownerId: userId, available: true, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    const toKeep = machines.slice(0, FREE_LIMIT);
    const toDeactivate = machines.slice(FREE_LIMIT);

    if (toDeactivate.length > 0) {
      await this.prisma.machine.updateMany({
        where: { id: { in: toDeactivate.map(m => m.id) } },
        data: { available: false, status: 'INACTIVE' },
      });
    }

    if (toKeep.length > 0) {
      await this.prisma.machine.updateMany({
        where: { id: { in: toKeep.map(m => m.id) } },
        data: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: 'free', maxAds: FREE_LIMIT, maxPremiumAds: 0, maxFeaturedAds: 0 },
    });

    this.logger.log(`⬇️ Usuário ${userId} rebaixado para plano free — ${toDeactivate.length} anúncios desativados`);
  }
}
