import { Module } from '@nestjs/common';
import { AdminPanelController } from './admin-panel.controller';
import { AdminService } from './admin-panel.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [AdminPanelController],
  providers: [AdminService, PrismaService],
})
export class AdminModule {}
