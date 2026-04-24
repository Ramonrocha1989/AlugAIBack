import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateProfileDto } from './dto/company.dto';

const PROFILE_SELECT = {
  id: true,
  companyName: true,
  description: true,
  phone: true,
  location: true,
  website: true,
  logo: true,
  banner: true,
  businessHours: true,
  categoriesWorked: true,
  gallery: true,
  plan: true,
  isVerifiedSeller: true,
  createdAt: true,
};

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const [avgRating, totalReviews] = await Promise.all([
      this.prisma.review.aggregate({ where: { reviewedUserId: userId }, _avg: { rating: true } }),
      this.prisma.review.count({ where: { reviewedUserId: userId } }),
    ]);

    return {
      ...user,
      rating: avgRating._avg.rating || 0,
      total_reviews: totalReviews,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    const plan = user.plan;

    if (dto.logo && !['basico', 'profissional', 'premium'].includes(plan)) {
      throw new ForbiddenException('Logo disponível a partir do plano Básico');
    }
    if (dto.banner && !['profissional', 'premium'].includes(plan)) {
      throw new ForbiddenException('Banner disponível a partir do plano Profissional');
    }
    if ((dto.businessHours || dto.categoriesWorked) && !['profissional', 'premium'].includes(plan)) {
      throw new ForbiddenException('Disponível a partir do plano Profissional');
    }
    if (dto.phone && !['profissional', 'premium'].includes(plan)) {
      throw new ForbiddenException('Telefone público disponível a partir do plano Profissional');
    }
    if (dto.website && plan !== 'premium') {
      throw new ForbiddenException('Website disponível apenas no plano Premium');
    }
    if (dto.gallery && plan !== 'premium') {
      throw new ForbiddenException('Galeria disponível apenas no plano Premium');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PROFILE_SELECT,
    });
  }

  async getCompany(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PROFILE_SELECT,
    });

    if (!user) throw new NotFoundException('Empresa não encontrada');

    const [avgRating, totalReviews] = await Promise.all([
      this.prisma.review.aggregate({ where: { reviewedUserId: id }, _avg: { rating: true } }),
      this.prisma.review.count({ where: { reviewedUserId: id } }),
    ]);

    return {
      id: user.id,
      company_name: user.companyName,
      description: user.description,
      phone: user.phone,
      location: user.location,
      website: user.website,
      logo: user.logo,
      banner: user.banner,
      businessHours: user.businessHours,
      categoriesWorked: user.categoriesWorked,
      gallery: user.gallery,
      plan: user.plan,
      is_verified: user.isVerifiedSeller,
      rating: avgRating._avg.rating || 0,
      total_reviews: totalReviews,
      created_at: user.createdAt,
    };
  }

  async getCompanyMachines(userId: string) {
    const machines = await this.prisma.machine.findMany({
      where: { ownerId: userId, status: 'ACTIVE', available: true },
      include: {
        owner: {
          select: { id: true, name: true, isVerifiedSeller: true, plan: true },
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
