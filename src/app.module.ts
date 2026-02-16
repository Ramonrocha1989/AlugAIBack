import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { EquipmentsModule } from './modules/equipments/equipments.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { AdminModule } from './modules/admin/admin.module';
import { MachinesModule } from './modules/machines/machines.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { UsersModule } from './modules/users/users.module';
import { PlansModule } from './modules/plans/plans.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { PrismaService } from './common/prisma.service';

@Module({
  imports: [
    AuthModule,
    CompaniesModule,
    EquipmentsModule,
    RentalsModule,
    AdminModule,
    MachinesModule,
    FavoritesModule,
    ReviewsModule,
    NotificationsModule,
    ProposalsModule,
    UsersModule,
    PlansModule,
  ],
  providers: [
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
