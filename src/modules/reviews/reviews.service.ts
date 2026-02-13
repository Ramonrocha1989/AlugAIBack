import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    if (reviewerId === dto.reviewedUserId) {
      throw new BadRequestException('Não pode avaliar a si mesmo');
    }

    const reviewedUser = await this.prisma.user.findUnique({
      where: { id: dto.reviewedUserId },
    });

    if (!reviewedUser) {
      throw new NotFoundException('Usuário avaliado não encontrado');
    }

    if (dto.machineId) {
      const machine = await this.prisma.machine.findUnique({
        where: { id: dto.machineId },
      });

      if (!machine) {
        throw new NotFoundException('Máquina não encontrada');
      }
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          reviewerId,
          reviewedUserId: dto.reviewedUserId,
          machineId: dto.machineId,
          rating: dto.rating,
          comment: dto.comment,
        },
        include: {
          reviewer: { select: { id: true, name: true } },
          reviewedUser: { select: { id: true, name: true } },
          machine: { select: { id: true, name: true } },
        },
      });

      // Criar notificação
      await this.prisma.notification.create({
        data: {
          userId: dto.reviewedUserId,
          type: 'NEW_REVIEW',
          title: 'Nova avaliação recebida',
          message: `${review.reviewer.name} avaliou você com ${dto.rating} estrelas`,
          link: '/dashboard/reviews',
        },
      });

      return review;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Você já avaliou esta transação');
      }
      throw error;
    }
  }

  async findByUser(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { reviewedUserId: userId },
      include: {
        reviewer: { select: { id: true, name: true } },
        machine: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = await this.prisma.review.aggregate({
      where: { reviewedUserId: userId },
      _count: true,
      _avg: { rating: true },
    });

    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { reviewedUserId: userId },
      _count: true,
    });

    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(d => {
      ratingDist[d.rating] = d._count;
    });

    return {
      reviews,
      stats: {
        totalReviews: stats._count,
        averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
        fiveStars: ratingDist[5],
        fourStars: ratingDist[4],
        threeStars: ratingDist[3],
        twoStars: ratingDist[2],
        oneStar: ratingDist[1],
      },
    };
  }

  async findByMachine(machineId: string) {
    return this.prisma.review.findMany({
      where: { machineId },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserRating(userId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { reviewedUserId: userId },
      _count: true,
      _avg: { rating: true },
    });

    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { reviewedUserId: userId },
      _count: true,
    });

    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach(d => {
      ratingDist[d.rating] = d._count;
    });

    return {
      userId,
      totalReviews: stats._count,
      averageRating: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0,
      distribution: ratingDist,
    };
  }

  async update(id: string, reviewerId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('Você não pode editar esta avaliação');
    }

    const daysDiff = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      throw new ForbiddenException('Não pode editar após 7 dias');
    }

    return this.prisma.review.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, reviewerId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('Você não pode deletar esta avaliação');
    }

    await this.prisma.review.delete({
      where: { id },
    });
  }
}
