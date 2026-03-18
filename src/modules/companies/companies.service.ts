import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getMyCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async getCompany(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        description: true,
        phone: true,
        location: true,
        website: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const [avgRating, totalReviews] = await Promise.all([
      this.prisma.review.aggregate({
        where: { reviewedUserId: id },
        _avg: { rating: true },
      }),
      this.prisma.review.count({
        where: { reviewedUserId: id },
      }),
    ]);

    return {
      id: user.id,
      company_name: user.companyName,
      description: user.description,
      phone: user.phone,
      location: user.location,
      website: user.website,
      rating: avgRating._avg.rating || 0,
      total_reviews: totalReviews,
      created_at: user.createdAt,
    };
  }

  async getCompanyMachines(userId: string) {
    const machines = await this.prisma.machine.findMany({
      where: {
        ownerId: userId,
        status: 'ACTIVE',
        available: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            isVerifiedSeller: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return machines.map(m => {
      const { owner, ...rest } = m;
      return {
        ...rest,
        ownerPlan: owner.plan,
        isVerifiedSeller: owner.isVerifiedSeller,
      };
    });
  }
}
