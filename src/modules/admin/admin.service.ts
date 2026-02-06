import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: {
        company: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRentals() {
    return this.prisma.rental.findMany({
      include: {
        equipment: {
          include: {
            company: true,
          },
        },
        renterCompany: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
