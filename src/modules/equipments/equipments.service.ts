import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateEquipmentDto, UpdateEquipmentDto } from './dto/equipment.dto';

@Injectable()
export class EquipmentsService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateEquipmentDto) {
    const { dailyPrice, category, ...rest } = dto as any;
    return this.prisma.equipment.create({
      data: {
        ...rest,
        pricePerDay: dailyPrice,
        companyId,
      },
      include: {
        company: true,
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

    return this.prisma.equipment.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    return equipment;
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
