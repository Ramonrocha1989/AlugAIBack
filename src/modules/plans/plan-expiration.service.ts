import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class PlanExpirationService {
  private readonly logger = new Logger(PlanExpirationService.name);

  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  @Cron('0 3 * * *')
  async expirePlans() {
    this.logger.log('Verificando planos expirados...');

    try {
      const expiredUsers = await this.prisma.user.findMany({
        where: {
          plan: { not: 'free' },
          planExpiresAt: { lt: new Date() },
          status: 'ACTIVE',
        },
        select: { id: true, plan: true },
      });

      for (const user of expiredUsers) {
        await this.webhooksService.onPlanCancelled(user.id);
        this.logger.log(`Plano expirado: usuário ${user.id} (${user.plan} → free)`);
      }

      this.logger.log(`Expiração concluída — ${expiredUsers.length} planos rebaixados`);
    } catch (error) {
      this.logger.error('Erro na expiração de planos:', error);
    }
  }
}
