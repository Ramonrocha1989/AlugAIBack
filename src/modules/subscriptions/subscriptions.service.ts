import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  async cancel(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionId: true },
    });

    if (!user?.subscriptionId) {
      throw new BadRequestException('Nenhuma assinatura ativa');
    }

    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${user.subscriptionId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      },
    );

    if (!response.ok) {
      throw new BadRequestException('Erro ao cancelar assinatura no Mercado Pago');
    }

    await this.webhooksService.onPlanCancelled(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionId: null },
    });

    return { message: 'Assinatura cancelada com sucesso' };
  }
}
