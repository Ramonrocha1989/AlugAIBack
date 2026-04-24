import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [VerificationController],
  providers: [VerificationService, PrismaService],
})
export class VerificationModule {}
