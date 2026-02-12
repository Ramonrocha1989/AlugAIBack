import { Module } from '@nestjs/common';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [MachinesController],
  providers: [MachinesService, PrismaService],
  exports: [MachinesService],
})
export class MachinesModule {}
