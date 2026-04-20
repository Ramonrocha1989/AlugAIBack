import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PlanExpirationService } from './plan-expiration.service';
import { PrismaService } from '../../common/prisma.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  controllers: [PlansController],
  providers: [PlansService, PlanExpirationService, PrismaService],
  exports: [PlansService],
})
export class PlansModule {}
