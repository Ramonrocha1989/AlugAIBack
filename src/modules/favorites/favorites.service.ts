import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async addFavorite(userId: string, machineId: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_machineId: { userId, machineId },
      },
    });

    if (existing) {
      throw new ConflictException('Máquina já está nos favoritos');
    }

    return this.prisma.favorite.create({
      data: { userId, machineId },
    });
  }

  async removeFavorite(userId: string, machineId: string) {
    await this.prisma.favorite.deleteMany({
      where: { userId, machineId },
    });
  }

  async getFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        machine: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map(fav => ({
      id: fav.id,
      createdAt: fav.createdAt,
      machine: fav.machine,
    }));
  }

  async isFavorited(userId: string, machineId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_machineId: { userId, machineId },
      },
    });

    return { isFavorited: !!favorite };
  }
}
