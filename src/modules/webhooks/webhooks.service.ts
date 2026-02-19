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
    console.log('📥 Webhook recebido:', JSON.stringify(body, null, 2));

    if (body.type === 'payment') {
      const paymentId = body.data.id;
      console.log('💳 Payment ID:', paymentId);
      
      try {
        const payment = new Payment(this.client);
        const paymentData = await payment.get({ id: paymentId });

        console.log('📊 Status do pagamento:', paymentData.status);
        console.log('🔗 External Reference:', paymentData.external_reference);

        if (paymentData.status === 'approved') {
          const externalReference = paymentData.external_reference;
          
          if (externalReference) {
            const parts = externalReference.split('-');
            const planType = parts[parts.length - 1];
            const userId = parts.slice(0, -1).join('-');
            console.log('👤 User ID:', userId);
            console.log('📦 Plan Type:', planType);
            
            await this.prisma.user.update({
              where: { id: userId },
              data: {
                plan: planType,
                planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
            
            console.log('✅ Plano ativado para usuário:', userId);
          } else {
            console.log('⚠️ External reference vazio');
          }
        } else {
          console.log('⏭️ Pagamento não aprovado, status:', paymentData.status);
        }
      } catch (error: any) {
        console.error('❌ Erro ao processar pagamento:', error.message);
        console.error('Stack:', error.stack);
      }
    } else {
      console.log('⏭️ Tipo de webhook ignorado:', body.type);
    }
  }
}
