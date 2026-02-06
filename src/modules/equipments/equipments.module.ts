import { Module } from '@nestjs/common';
import { EquipmentsController } from './equipments.controller';
import { EquipmentsService } from './equipments.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [EquipmentsController],
  providers: [EquipmentsService, PrismaService],
})
export class EquipmentsModule {}
