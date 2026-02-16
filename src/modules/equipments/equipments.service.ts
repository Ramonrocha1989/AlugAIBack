import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto';

@Injectable()
export class EquipmentsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, userId: string, dto: CreateEquipmentDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, maxAds: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.plan === 'free') {
      const activeAdsCount = await this.prisma.equipment.count({
        where: { 
          company: { users: { some: { id: userId } } },
          isActive: true 
        },
      });

      if (activeAdsCount >= user.maxAds) {
        throw new ForbiddenException(
          'Limite de anúncios atingido. Faça upgrade para o plano Lojista.'
        );
      }
    }

    const { dailyPrice, category, ...rest } = dto as any;
    return this.prisma.equipment.create({
      data: {
        ...rest,
        pricePerDay: dailyPrice,
        companyId,
      },
      include: {
        company: {
          include: {
            users: {
              select: { id: true, name: true, plan: true },
              take: 1,
            },
          },
        },
      },
    });
  }

  async findAll(filters?: { location?: string; minPrice?: number; maxPrice?: number }) {
    const where: any = { isActive: true };

    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.pricePerDay = {};
      if (filters.minPrice) where.pricePerDay.gte = filters.minPrice;
      if (filters.maxPrice) where.pricePerDay.lte = filters.maxPrice;
    }

    const equipments = await this.prisma.equipment.findMany({
      where,
      include: {
        company: {
          include: {
            users: {
              select: { id: true, name: true, plan: true },
              take: 1,
            },
          },
        },
      },
    });

    return equipments.sort((a, b) => {
      if (a.isPremium !== b.isPremium) return b.isPremium ? 1 : -1;
      
      const planA = a.company.users[0]?.plan || 'free';
      const planB = b.company.users[0]?.plan || 'free';
      
      if (planA !== planB) {
        if (planA === 'lojista') return -1;
        if (planB === 'lojista') return 1;
      }
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    }).map(eq => ({
      ...eq,
      ownerPlan: eq.company.users[0]?.plan || 'free',
    }));
  }

  async findByCompany(companyId: string) {
    return this.prisma.equipment.findMany({
      where: { 
        companyId,
        isActive: true 
      },
      include: {
        company: {
          include: {
            users: {
              select: { id: true, name: true, plan: true },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            users: {
              select: { id: true, name: true, plan: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    await this.prisma.equipment.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return {
      ...equipment,
      ownerPlan: equipment.company.users[0]?.plan || 'free',
    };
  }

  async trackWhatsappClick(id: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }
    
    await this.prisma.equipment.update({
      where: { id },
      data: { whatsappClicks: { increment: 1 } },
    });
    return { message: 'WhatsApp click tracked' };
  }

  async markQualifiedLead(id: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }
    
    await this.prisma.equipment.update({
      where: { id },
      data: { qualifiedLeads: { increment: 1 } },
    });
    return { message: 'Qualified lead marked' };
  }

  async update(id: string, companyId: string, dto: UpdateEquipmentDto) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (equipment.companyId !== companyId) {
      throw new ForbiddenException('You can only update your own equipment');
    }

    return this.prisma.equipment.update({
      where: { id },
      data: dto,
      include: {
        company: true,
      },
    });
  }

  async remove(id: string, companyId: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (equipment.companyId !== companyId) {
      throw new ForbiddenException('You can only delete your own equipment');
    }

    await this.prisma.equipment.delete({
      where: { id },
    });

    return { message: 'Equipment deleted successfully' };
  }
}
