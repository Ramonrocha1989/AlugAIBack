import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateMachineDto, UpdateMachineDto, MachineFiltersDto } from './dto/machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userName: string, dto: CreateMachineDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, isVerifiedSeller: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const categoryExists = await this.prisma.category.findFirst({
      where: { slug: dto.category, isActive: true },
    });
    if (!categoryExists) {
      throw new BadRequestException('Categoria inválida');
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: user.plan } });

    if (plan) {
      const activeAdsCount = await this.prisma.machine.count({
        where: { ownerId: userId, available: true, status: 'ACTIVE' },
      });

      if (activeAdsCount >= plan.maxAds) {
        throw new ForbiddenException(
          `Limite de ${plan.maxAds} anúncios atingido. Faça upgrade do seu plano.`,
        );
      }

      if (dto.images && dto.images.length > plan.maxPhotos) {
        throw new ForbiddenException(
          `Seu plano permite no máximo ${plan.maxPhotos} fotos por anúncio.`,
        );
      }

      if (dto.videoUrl && plan.maxVideos === 0) {
        throw new ForbiddenException(
          'Seu plano não permite vídeos. Faça upgrade.',
        );
      }
    }

    const expiresAt = plan && plan.adDuration === -1
      ? null
      : new Date(Date.now() + (plan?.adDuration ?? 30) * 24 * 60 * 60 * 1000);

    const machine = await this.prisma.machine.create({
      data: {
        ...dto,
        ownerId: userId,
        ownerName: userName,
        status: user.isVerifiedSeller ? 'ACTIVE' : 'PENDING',
        isVerifiedSeller: user.isVerifiedSeller,
        expiresAt,
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

    let orderBy: any[];

    switch (sortBy) {
      case 'engine_hours_asc':
        orderBy = [{ engineHours: { sort: 'asc', nulls: 'last' } }];
        break;
      case 'price_asc':
        orderBy = [{ price: 'asc' }];
        break;
      case 'price_desc':
        orderBy = [{ price: 'desc' }];
        break;
      case 'year_desc':
        orderBy = [{ yearModel: 'desc' }];
        break;
      default:
        orderBy = [
          { owner: { plan: 'desc' } },
          { isPremium: 'desc' },
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ];
        break;
    }

    const [machines, total] = await Promise.all([
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
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.machine.count({ where }),
    ]);

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
            plan: true,
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
      ownerPlan: machine.owner.plan,
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
        _count: { select: { favorites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const machineIds = machines.map(m => m.id);

    const proposalCounts = machineIds.length
      ? await this.prisma.proposal.groupBy({
          by: ['machineId', 'status'],
          where: { machineId: { in: machineIds } },
          _count: true,
        })
      : [];

    const proposalMap = new Map<string, Record<string, number>>();
    for (const p of proposalCounts) {
      if (!proposalMap.has(p.machineId)) {
        proposalMap.set(p.machineId, { pending: 0, accepted: 0, rejected: 0, countered: 0 });
      }
      proposalMap.get(p.machineId)![p.status.toLowerCase()] = p._count;
    }

    return machines.map(m => ({
      ...m,
      isVerifiedSeller: m.owner.isVerifiedSeller,
      favoritesCount: m._count.favorites,
      proposalsCount: proposalMap.get(m.id) || { pending: 0, accepted: 0, rejected: 0, countered: 0 },
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
        owner: { select: { plan: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Máquina não encontrada');
    }

    if (existing.ownerId !== userId) {
      throw new ForbiddenException('Você só pode atualizar suas próprias máquinas');
    }

    if (dto.category) {
      const categoryExists = await this.prisma.category.findFirst({
        where: { slug: dto.category, isActive: true },
      });
      if (!categoryExists) {
        throw new BadRequestException('Categoria inválida');
      }
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: existing.owner.plan } });

    if (plan) {
      if (dto.images && dto.images.length > plan.maxPhotos) {
        throw new ForbiddenException(
          `Seu plano permite no máximo ${plan.maxPhotos} fotos por anúncio.`,
        );
      }

      if (dto.videoUrl && plan.maxVideos === 0) {
        throw new ForbiddenException('Seu plano não permite vídeos. Faça upgrade.');
      }

      if (dto.isPremium && !existing.isPremium) {
        const premiumCount = await this.prisma.machine.count({
          where: {
            ownerId: userId,
            isPremium: true,
            id: { not: id },
            available: true,
            status: 'ACTIVE',
          },
        });

        if (premiumCount >= plan.maxPremiumAds) {
          throw new ForbiddenException(
            `Limite de anúncios Premium atingido (${plan.maxPremiumAds} máximo).`,
          );
        }
      }

      if (dto.isFeatured && !existing.isFeatured) {
        const featuredCount = await this.prisma.machine.count({
          where: {
            ownerId: userId,
            isFeatured: true,
            id: { not: id },
            available: true,
            status: 'ACTIVE',
          },
        });

        if (featuredCount >= plan.maxFeaturedAds) {
          throw new ForbiddenException(
            `Limite de anúncios em Destaque atingido (${plan.maxFeaturedAds} máximo).`,
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
