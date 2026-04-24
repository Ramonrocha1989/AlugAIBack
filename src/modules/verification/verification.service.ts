import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RequestVerificationDto } from './verification.dto';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async createRequest(userId: string, dto: RequestVerificationDto) {
    const pending = await this.prisma.verificationRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (pending) {
      throw new BadRequestException('Você já tem uma solicitação pendente');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isVerifiedSeller: true } });
    if (user?.isVerifiedSeller) {
      throw new BadRequestException('Você já é um vendedor verificado');
    }

    return this.prisma.verificationRequest.create({
      data: { userId, ...dto },
      select: { id: true, status: true, createdAt: true },
    });
  }
}
