import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateMachineDto, UpdateMachineDto, MachineFiltersDto } from './dto/machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, userName: string, dto: CreateMachineDto) {
    return this.prisma.machine.create({
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
          },
        },
      },
    });
  }

  async findAll(filters: MachineFiltersDto) {
    const { page = 1, limit = 20, search, ...rest } = filters;
    const skip = (page - 1) * limit;

    const where: any = { available: true };

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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.machine.count({ where }),
    ]);

    return {
      data: machines,
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
          },
        },
      },
    });

    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }

    return machine;
  }

  async findMyMachines(userId: string) {
    return this.prisma.machine.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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

  async update(id: string, userId: string, dto: UpdateMachineDto) {
    const machine = await this.prisma.machine.findUnique({
      where: { id },
    });

    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }

    if (machine.ownerId !== userId) {
      throw new ForbiddenException('Você só pode atualizar suas próprias máquinas');
    }

    return this.prisma.machine.update({
      where: { id },
      data: dto,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
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
