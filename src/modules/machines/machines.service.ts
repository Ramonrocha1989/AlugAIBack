import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { CreateMachineDto, UpdateMachineDto, MachineFiltersDto } from './dto/machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  private machineListInclude = {
    owner: {
      select: {
        id: true,
        name: true,
        isVerifiedSeller: true,
        plan: true,
      },
    },
  } satisfies Prisma.MachineInclude;

  private toMachineListItem(machine: any) {
    const { ownerPhone, owner, ...rest } = machine;
    return {
      ...rest,
      ownerPlan: owner.plan,
      isVerifiedSeller: owner.isVerifiedSeller,
    };
  }

  private buildBaseWhere(filters: Omit<MachineFiltersDto, 'search' | 'sortBy' | 'page' | 'limit'>): Prisma.MachineWhereInput {
    const where: Prisma.MachineWhereInput = {
      available: true,
      status: 'ACTIVE',
    };

    if (filters.category) where.category = filters.category;
    if (filters.businessType) where.businessType = filters.businessType;
    if (filters.manufacturer) where.manufacturer = { contains: filters.manufacturer, mode: 'insensitive' };
    if (filters.state) where.state = filters.state;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    if (filters.minYear || filters.maxYear) {
      where.yearModel = {};
      if (filters.minYear) where.yearModel.gte = filters.minYear;
      if (filters.maxYear) where.yearModel.lte = filters.maxYear;
    }

    if (filters.minEngineHours !== undefined || filters.maxEngineHours !== undefined) {
      where.engineHours = {};
      if (filters.minEngineHours !== undefined) where.engineHours.gte = filters.minEngineHours;
      if (filters.maxEngineHours !== undefined) where.engineHours.lte = filters.maxEngineHours;
    }

    if (filters.minPower || filters.maxPower) {
      where.power = {};
      if (filters.minPower) where.power.gte = filters.minPower;
      if (filters.maxPower) where.power.lte = filters.maxPower;
    }

    if (filters.acceptsTradeDown !== undefined) where.acceptsTradeDown = filters.acceptsTradeDown;
    if (filters.acceptsTradeUp !== undefined) where.acceptsTradeUp = filters.acceptsTradeUp;
    if (filters.acceptsGrains !== undefined) where.acceptsGrains = filters.acceptsGrains;
    if (filters.acceptsFinancing !== undefined) where.acceptsFinancing = filters.acceptsFinancing;
    if (filters.isVerifiedSeller !== undefined) where.isVerifiedSeller = filters.isVerifiedSeller;

    return where;
  }

  private buildSearchWhereSql(filters: Omit<MachineFiltersDto, 'sortBy' | 'page' | 'limit'>) {
    const values: any[] = [];
    const whereParts = ['m.available = true', "m.status = 'ACTIVE'"];

    const addParam = (value: any) => {
      values.push(value);
      return `$${values.length}`;
    };

    const searchParam = addParam(filters.search!.trim());
    const searchDocument = `
      setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(m.name, ''))), 'A') ||
      setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(m.manufacturer, ''))), 'A') ||
      setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(m.model, ''))), 'A') ||
      setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(m.city, ''))), 'B') ||
      setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(m.state, ''))), 'B') ||
      setweight(to_tsvector('portuguese', immutable_unaccent(coalesce(m.description, ''))), 'C')
    `;
    const searchQuery = `websearch_to_tsquery('portuguese', immutable_unaccent(${searchParam}::text))`;
    const unaccentedSearch = `immutable_unaccent(${searchParam}::text)`;
    const searchCondition = `(
      (${searchDocument}) @@ ${searchQuery}
      OR immutable_unaccent(coalesce(m.name, '')) ILIKE '%' || ${unaccentedSearch} || '%'
      OR immutable_unaccent(coalesce(m.description, '')) ILIKE '%' || ${unaccentedSearch} || '%'
      OR immutable_unaccent(coalesce(m.manufacturer, '')) ILIKE '%' || ${unaccentedSearch} || '%'
      OR immutable_unaccent(coalesce(m.model, '')) ILIKE '%' || ${unaccentedSearch} || '%'
      OR immutable_unaccent(coalesce(m.city, '')) ILIKE '%' || ${unaccentedSearch} || '%'
      OR immutable_unaccent(coalesce(m.state, '')) ILIKE '%' || ${unaccentedSearch} || '%'
    )`;
    whereParts.push(searchCondition);

    if (filters.category) whereParts.push(`m.category = ${addParam(filters.category)}`);
    if (filters.businessType) whereParts.push(`m."businessType" = ${addParam(filters.businessType)}::"BusinessType"`);
    if (filters.manufacturer) whereParts.push(`immutable_unaccent(coalesce(m.manufacturer, '')) ILIKE '%' || immutable_unaccent(${addParam(filters.manufacturer)}::text) || '%'`);
    if (filters.state) whereParts.push(`m.state = ${addParam(filters.state)}`);
    if (filters.city) whereParts.push(`immutable_unaccent(coalesce(m.city, '')) ILIKE '%' || immutable_unaccent(${addParam(filters.city)}::text) || '%'`);
    if (filters.minPrice) whereParts.push(`m.price >= ${addParam(filters.minPrice)}`);
    if (filters.maxPrice) whereParts.push(`m.price <= ${addParam(filters.maxPrice)}`);
    if (filters.minYear) whereParts.push(`m."yearModel" >= ${addParam(filters.minYear)}`);
    if (filters.maxYear) whereParts.push(`m."yearModel" <= ${addParam(filters.maxYear)}`);
    if (filters.minEngineHours !== undefined) whereParts.push(`m."engineHours" >= ${addParam(filters.minEngineHours)}`);
    if (filters.maxEngineHours !== undefined) whereParts.push(`m."engineHours" <= ${addParam(filters.maxEngineHours)}`);
    if (filters.minPower) whereParts.push(`m.power >= ${addParam(filters.minPower)}`);
    if (filters.maxPower) whereParts.push(`m.power <= ${addParam(filters.maxPower)}`);
    if (filters.acceptsTradeDown !== undefined) whereParts.push(`m."acceptsTradeDown" = ${addParam(filters.acceptsTradeDown)}`);
    if (filters.acceptsTradeUp !== undefined) whereParts.push(`m."acceptsTradeUp" = ${addParam(filters.acceptsTradeUp)}`);
    if (filters.acceptsGrains !== undefined) whereParts.push(`m."acceptsGrains" = ${addParam(filters.acceptsGrains)}`);
    if (filters.acceptsFinancing !== undefined) whereParts.push(`m."acceptsFinancing" = ${addParam(filters.acceptsFinancing)}`);
    if (filters.isVerifiedSeller !== undefined) whereParts.push(`m."isVerifiedSeller" = ${addParam(filters.isVerifiedSeller)}`);

    return {
      values,
      whereSql: whereParts.join(' AND '),
      searchDocument,
      searchQuery,
      unaccentedSearch,
      addParam,
    };
  }

  private async findAllWithSearch(filters: MachineFiltersDto, search: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { whereSql, searchDocument, searchQuery, unaccentedSearch, values, addParam } = this.buildSearchWhereSql({
      ...filters,
      search,
    });
    const limitParam = addParam(limit);
    const offsetParam = addParam(skip);

    const idsQuery = `
      SELECT m.id
      FROM machines m
      JOIN users u ON u.id = m."ownerId"
      WHERE ${whereSql}
      ORDER BY
        ts_rank_cd((${searchDocument}), ${searchQuery}) DESC,
        CASE
          WHEN immutable_unaccent(coalesce(m.name, '')) ILIKE ${unaccentedSearch} || '%' THEN 4
          WHEN immutable_unaccent(coalesce(m.name, '')) ILIKE '%' || ${unaccentedSearch} || '%' THEN 3
          WHEN immutable_unaccent(coalesce(m.manufacturer, '')) ILIKE '%' || ${unaccentedSearch} || '%'
            OR immutable_unaccent(coalesce(m.model, '')) ILIKE '%' || ${unaccentedSearch} || '%' THEN 2
          WHEN immutable_unaccent(coalesce(m.city, '')) ILIKE '%' || ${unaccentedSearch} || '%'
            OR immutable_unaccent(coalesce(m.state, '')) ILIKE '%' || ${unaccentedSearch} || '%' THEN 1
          ELSE 0
        END DESC,
        u.plan DESC,
        m."isPremium" DESC,
        m."isFeatured" DESC,
        m."createdAt" DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `;

    const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM machines m
      JOIN users u ON u.id = m."ownerId"
      WHERE ${whereSql}
    `;

    const [idRows, countRows] = await Promise.all([
      this.prisma.$queryRawUnsafe<{ id: string }[]>(idsQuery, ...values),
      this.prisma.$queryRawUnsafe<{ count: number }[]>(countQuery, ...values.slice(0, -2)),
    ]);

    const ids = idRows.map(row => row.id);
    const machines = ids.length
      ? await this.prisma.machine.findMany({
          where: { id: { in: ids } },
          include: this.machineListInclude,
        })
      : [];
    const machineById = new Map(machines.map(machine => [machine.id, machine]));
    const orderedMachines = ids.map(id => machineById.get(id)).filter(Boolean);
    const total = countRows[0]?.count ?? 0;

    return {
      data: orderedMachines.map(machine => this.toMachineListItem(machine)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

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
    const trimmedSearch = search?.trim();

    if (rest.category) {
      const categoryExists = await this.prisma.category.findFirst({
        where: { slug: rest.category, isActive: true },
        select: { id: true },
      });

      if (!categoryExists) {
        throw new BadRequestException('Categoria inválida ou inativa');
      }
    }

    if (trimmedSearch) {
      return this.findAllWithSearch(filters, trimmedSearch, page, limit);
    }

    const skip = (page - 1) * limit;
    const where = this.buildBaseWhere(rest);

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
        include: this.machineListInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.machine.count({ where }),
    ]);

    return {
      data: machines.map(machine => this.toMachineListItem(machine)),
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
