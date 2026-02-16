import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateMachineDto, UpdateMachineDto, MachineFiltersDto } from './dto/machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userName: string, dto: CreateMachineDto) {
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
    const { page = 1, limit = 20, search, ...rest } = filters;
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

    const [machines, total] = await Promise.all([
      this.prisma.machine.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
              isVerifiedSeller: true,
              plan: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.machine.count({ where }),
    ]);

    return {
      data: machines.map(m => ({
        ...m,
        ownerPhone: m.ownerPhone || m.owner.phone,
        ownerPlan: m.owner.plan,
        isVerifiedSeller: m.owner.isVerifiedSeller,
      })),
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
          },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }

    return {
      ...machine,
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
    const machine = await this.prisma.machine.findUnique({ where: { id } });
    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }
    
    await this.prisma.machine.update({
      where: { id },
      data: { whatsappClicks: { increment: 1 } },
    });
    return { message: 'WhatsApp click tracked' };
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
    return { message: 'Qualified lead marked' };
  }

  async update(id: string, userId: string, dto: UpdateMachineDto) {
    const existing = await this.prisma.machine.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Máquina não encontrada');
    }

    if (existing.ownerId !== userId) {
      throw new ForbiddenException('Você só pode atualizar suas próprias máquinas');
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
