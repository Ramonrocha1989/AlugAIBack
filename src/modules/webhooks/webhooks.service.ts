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
    console.log('Webhook recebido:', body);

    if (body.type === 'payment') {
      const paymentId = body.data.id;
      
      const payment = new Payment(this.client);
      const paymentData = await payment.get({ id: paymentId });

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
    }
  }
}
