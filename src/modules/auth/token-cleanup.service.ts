import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 4 * * *')
  async cleanExpiredTokens() {
    this.logger.log('Iniciando limpeza de tokens expirados...');

    const now = new Date();

    try {
      const [refresh, password, email, deleteTokens] = await Promise.all([
        this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
        this.prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
        this.prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: now } } }),
        this.prisma.deleteToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      ]);

      this.logger.log(
        `Tokens removidos — Refresh: ${refresh.count}, Password: ${password.count}, Email: ${email.count}, Delete: ${deleteTokens.count}`,
      );
    } catch (error) {
      this.logger.error('Erro na limpeza de tokens:', error);
    }
  }
}
