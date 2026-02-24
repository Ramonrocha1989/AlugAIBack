import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AccountCleanupService {
  private readonly logger = new Logger(AccountCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 3 * * *')
  async deleteExpiredAccounts() {
    this.logger.log('Iniciando limpeza de contas marcadas para exclusão...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const usersToDelete = await this.prisma.user.findMany({
        where: {
          deletedAt: {
            lte: thirtyDaysAgo,
          },
          status: 'DELETED',
        },
        select: {
          id: true,
          email: true,
        },
      });

      this.logger.log(`Encontradas ${usersToDelete.length} contas para exclusão permanente`);

      for (const user of usersToDelete) {
        try {
          await this.prisma.$transaction(async (tx) => {
            await tx.proposal.deleteMany({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }] } });
            await tx.notification.deleteMany({ where: { userId: user.id } });
            await tx.review.deleteMany({ where: { OR: [{ reviewerId: user.id }, { reviewedUserId: user.id }] } });
            await tx.favorite.deleteMany({ where: { userId: user.id } });
            await tx.machine.deleteMany({ where: { ownerId: user.id } });
            await tx.deleteToken.deleteMany({ where: { userId: user.id } });
            await tx.refreshToken.deleteMany({ where: { userId: user.id } });
            await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
            await tx.emailVerificationToken.deleteMany({ where: { userId: user.id } });
            await tx.user.delete({ where: { id: user.id } });
          });

          this.logger.log(`Conta ${user.email} excluída permanentemente`);
        } catch (error) {
          this.logger.error(`Erro ao excluir conta ${user.email}:`, error);
        }
      }

      this.logger.log('Limpeza de contas concluída');
    } catch (error) {
      this.logger.error('Erro na limpeza de contas:', error);
    }
  }
}
