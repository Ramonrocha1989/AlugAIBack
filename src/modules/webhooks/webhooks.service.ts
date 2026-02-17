import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class WebhooksService {
  private client: MercadoPagoConfig;

  constructor(private prisma: PrismaService) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });
  }

  async handleMercadoPagoWebhook(body: any) {
    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      try {
        const payment = new Payment(this.client);
        const paymentData = await payment.get({ id: paymentId });

        console.log('Dados do pagamento:', JSON.stringify(paymentData, null, 2));

        if (paymentData.status === 'approved') {
          const externalReference = paymentData.external_reference;
          
          if (externalReference) {
            const [userId, planType] = externalReference.split('-');
            
            await this.prisma.user.update({
              where: { id: userId },
              data: {
                plan: planType,
                planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
            
            console.log('✅ Plano ativado para usuário:', userId);
          }
        }
      } catch (error: any) {
        console.error('Erro ao processar pagamento:', error.message);
        // Não lança erro para não retornar 500 ao Mercado Pago
        // Isso evita que o webhook seja reenviado indefinidamente
      }
    }
  }
}
