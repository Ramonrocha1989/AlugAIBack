import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MachineExpirationService {
  private readonly logger = new Logger(MachineExpirationService.name);
  private readonly BATCH_SIZE = 500;

  constructor(private prisma: PrismaService) {}

  @Cron('0 2 * * *')
  async expireOldMachines() {
    this.logger.log('Iniciando verificação de anúncios expirados...');

    try {
      let totalExpired = 0;
      let batch: number;

      do {
        const result = await this.prisma.machine.updateMany({
          where: {
            status: 'ACTIVE',
            available: true,
            expiresAt: { lt: new Date() },
          },
          data: {
            status: 'EXPIRED',
            available: false,
          },
        });

        batch = result.count;
        totalExpired += batch;
      } while (batch >= this.BATCH_SIZE);

      this.logger.log(`Expiração concluída — ${totalExpired} anúncios expirados`);
    } catch (error) {
      this.logger.error('Erro na expiração de anúncios:', error);
    }
  }
}
