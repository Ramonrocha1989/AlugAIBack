import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateMachineDto, UpdateMachineDto, MachineFiltersDto } from './dto/machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userName: string, dto: CreateMachineDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, maxAds: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.plan === 'free') {
      const activeAdsCount = await this.prisma.machine.count({
        where: { 
          ownerId: userId,
          available: true,
          status: 'ACTIVE'
        },
      });

      if (activeAdsCount >= user.maxAds) {
        throw new ForbiddenException(
          'Limite de anúncios atingido. Faça upgrade para o plano Lojista.'
        );
      }
    }

    const machine = await this.prisma.machine.create({
      data: {
        ...dto,
        ownerId: userId,
        ownerName: userName,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            isVerifiedSeller: true,
          },
        },
      },
    });

    return {
      ...machine,
      isVerifiedSeller: machine.owner.isVerifiedSeller,
    };
  }

  async findAll(filters: MachineFiltersDto) {
    const { page = 1, limit = 20, search, sortBy = 'recent', ...rest } = filters;
    const skip = (page - 1) * limit;

    const where: any = { 
      available: true,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (rest.category) where.category = rest.category;
    if (rest.businessType) where.businessType = rest.businessType;
    if (rest.manufacturer) where.manufacturer = { contains: rest.manufacturer, mode: 'insensitive' };
    if (rest.state) where.state = rest.state;
    if (rest.city) where.city = { contains: rest.city, mode: 'insensitive' };

    if (rest.minPrice || rest.maxPrice) {
      where.price = {};
      if (rest.minPrice) where.price.gte = rest.minPrice;
      if (rest.maxPrice) where.price.lte = rest.maxPrice;
    }

    if (rest.minYear || rest.maxYear) {
      where.yearModel = {};
      if (rest.minYear) where.yearModel.gte = rest.minYear;
      if (rest.maxYear) where.yearModel.lte = rest.maxYear;
    }

    if (rest.minEngineHours !== undefined || rest.maxEngineHours !== undefined) {
      where.engineHours = {};
      if (rest.minEngineHours !== undefined) where.engineHours.gte = rest.minEngineHours;
      if (rest.maxEngineHours !== undefined) where.engineHours.lte = rest.maxEngineHours;
    }

    if (rest.minPower || rest.maxPower) {
      where.power = {};
      if (rest.minPower) where.power.gte = rest.minPower;
      if (rest.maxPower) where.power.lte = rest.maxPower;
    }

    if (rest.acceptsTradeDown !== undefined) where.acceptsTradeDown = rest.acceptsTradeDown;
    if (rest.acceptsTradeUp !== undefined) where.acceptsTradeUp = rest.acceptsTradeUp;
    if (rest.acceptsGrains !== undefined) where.acceptsGrains = rest.acceptsGrains;
    if (rest.isVerifiedSeller !== undefined) where.isVerifiedSeller = rest.isVerifiedSeller;

    const [allMachines, total] = await Promise.all([
      this.prisma.machine.findMany({
        where,
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
      }),
      this.prisma.machine.count({ where }),
    ]);

    const sortedMachines = allMachines.sort((a, b) => {
      if (sortBy === 'engine_hours_asc') {
        if (a.engineHours === null) return 1;
        if (b.engineHours === null) return -1;
        return a.engineHours - b.engineHours;
      } else if (sortBy === 'price_asc') {
        return Number(a.price) - Number(b.price);
      } else if (sortBy === 'price_desc') {
        return Number(b.price) - Number(a.price);
      } else if (sortBy === 'year_desc') {
        return b.yearModel - a.yearModel;
      } else {
        if (a.isPremium !== b.isPremium) return b.isPremium ? 1 : -1;
        if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
        
        const planA = a.owner.plan || 'free';
        const planB = b.owner.plan || 'free';
        if (planA !== planB) {
          return planA === 'lojista' ? -1 : 1;
        }
        
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    const machines = sortedMachines.slice(skip, skip + limit);

    return {
      data: machines.map(m => {
        const { ownerPhone, owner, ...rest } = m;
        return {
          ...rest,
          ownerPlan: owner.plan,
          isVerifiedSeller: owner.isVerifiedSeller,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isVerifiedSeller: true,
            companyName: true,
          },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }

    return {
      ...machine,
      user: {
        id: machine.owner.id,
        company_name: machine.owner.companyName,
        phone: machine.ownerPhone || machine.owner.phone,
      },
      ownerPhone: machine.ownerPhone || machine.owner.phone,
      isVerifiedSeller: machine.owner.isVerifiedSeller,
    };
  }

  async findMyMachines(userId: string) {
    const machines = await this.prisma.machine.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            isVerifiedSeller: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return machines.map(m => ({
      ...m,
      isVerifiedSeller: m.owner.isVerifiedSeller,
    }));
  }

  async incrementView(id: string) {
    await this.prisma.machine.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
    });
    return { message: 'Visualização registrada' };
  }

  async trackWhatsappClick(id: string) {
    const machine = await this.prisma.machine.findUnique({ 
      where: { id },
      include: {
        owner: {
          select: {
            phone: true,
            email: true,
          },
        },
      },
    });
    
    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }
    
    await this.prisma.machine.update({
      where: { id },
      data: { whatsappClicks: { increment: 1 } },
    });
    
    return {
      message: 'Clique no WhatsApp registrado',
      contact: {
        ownerPhone: machine.ownerPhone || machine.owner.phone,
        ownerEmail: machine.owner.email,
      },
    };
  }

  async markQualifiedLead(id: string) {
    const machine = await this.prisma.machine.findUnique({ where: { id } });
    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }
    
    await this.prisma.machine.update({
      where: { id },
      data: { qualifiedLeads: { increment: 1 } },
    });
    return { message: 'Lead qualificado registrado' };
  }

  async update(id: string, userId: string, dto: UpdateMachineDto) {
    const existing = await this.prisma.machine.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            plan: true,
            maxPremiumAds: true,
            maxFeaturedAds: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Máquina não encontrada');
    }

    if (existing.ownerId !== userId) {
      throw new ForbiddenException('Você só pode atualizar suas próprias máquinas');
    }

    if (dto.isPremium !== undefined && dto.isPremium !== existing.isPremium) {
      if (dto.isPremium) {
        const premiumCount = await this.prisma.machine.count({
          where: {
            ownerId: userId,
            isPremium: true,
            id: { not: id },
            available: true,
            status: 'ACTIVE',
          },
        });

        if (premiumCount >= existing.owner.maxPremiumAds) {
          throw new ForbiddenException(
            `Limite de anúncios Premium atingido (${existing.owner.maxPremiumAds} máximo).`
          );
        }
      }
    }

    if (dto.isFeatured !== undefined && dto.isFeatured !== existing.isFeatured) {
      if (dto.isFeatured) {
        const featuredCount = await this.prisma.machine.count({
          where: {
            ownerId: userId,
            isFeatured: true,
            id: { not: id },
            available: true,
            status: 'ACTIVE',
          },
        });

        if (featuredCount >= existing.owner.maxFeaturedAds) {
          throw new ForbiddenException(
            `Limite de anúncios em Destaque atingido (${existing.owner.maxFeaturedAds} máximo).`
          );
        }
      }
    }

    const updated = await this.prisma.machine.update({
      where: { id },
      data: dto,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            isVerifiedSeller: true,
          },
        },
      },
    });

    return {
      ...updated,
      isVerifiedSeller: updated.owner.isVerifiedSeller,
    };
  }

  async remove(id: string, userId: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
    });

    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }

    if (machine.ownerId !== userId) {
      throw new ForbiddenException('Você só pode deletar suas próprias máquinas');
    }

    await this.prisma.machine.delete({
      where: { id },
    });

    return { message: 'Máquina deletada com sucesso' };
  }
}
