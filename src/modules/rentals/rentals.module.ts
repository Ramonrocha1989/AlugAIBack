import { Module } from '@nestjs/common';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [RentalsController],
  providers: [RentalsService, PrismaService],
})
export class RentalsModule {}
