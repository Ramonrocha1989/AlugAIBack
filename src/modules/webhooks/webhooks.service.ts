import { Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Payment } from 'mercadopago';
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

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          plan: planType,
          planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      
      this.logger.log(`✅ Plano ${planType} ativado para usuário ${userId}`);

    } catch (error: any) {
      this.logger.error(`Erro ao processar pagamento ${paymentId}: ${error.message}`);
    }
  }
}
