import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Payment } from 'mercadopago';
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
    if (body.type !== 'payment') {
      return;
    }

    const paymentId = body.data?.id;
    
    if (!paymentId) {
      return;
    }

    try {
      const payment = new Payment(this.client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status !== 'approved') {
        return;
      }

      const externalReference = paymentData.external_reference;
      
      if (!externalReference) {
        this.logger.warn(`Pagamento ${paymentId} sem external_reference`);
        return;
      }

      const parts = externalReference.split('-');
      const planType = parts[parts.length - 1];
      const userId = parts.slice(0, -1).join('-');
      
      if (!userId || !planType) {
        this.logger.error(`External reference inválido: ${externalReference}`);
        return;
      }

      const planLimits = {
        free: { maxAds: 3, maxPremiumAds: 0, maxFeaturedAds: 0 },
        lojista: { maxAds: 999, maxPremiumAds: 3, maxFeaturedAds: 5 },
      };

      const limits = planLimits[planType] || planLimits.free;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          plan: planType,
          planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ...limits,
        },
      });
      
      this.logger.log(`✅ Plano ${planType} ativado para usuário ${userId}`);

    } catch (error: any) {
      this.logger.error(`Erro ao processar pagamento ${paymentId}: ${error.message}`);
    }
  }
}
