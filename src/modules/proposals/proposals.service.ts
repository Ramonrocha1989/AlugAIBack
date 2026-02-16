import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProposalDto, CounterProposalDto } from './dto/proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  async create(senderId: string, dto: CreateProposalDto) {
    const machine = await this.prisma.machine.findUnique({
      where: { id: dto.machineId },
      include: { owner: true },
    });

    if (!machine) {
      throw new NotFoundException('Máquina não encontrada');
    }

    if (machine.ownerId === senderId) {
      throw new BadRequestException('Você não pode fazer proposta para sua própria máquina');
    }

    return this.prisma.proposal.create({
      data: {
        machineId: dto.machineId,
        senderId,
        receiverId: machine.ownerId,
        proposedPrice: dto.proposedPrice,
        message: dto.message,
      },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, type: 'sent' | 'received') {
    const where = type === 'sent' ? { senderId: userId } : { receiverId: userId };

    return this.prisma.proposal.findMany({
      where,
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.receiverId !== userId) {
      throw new ForbiddenException('Apenas o dono da máquina pode aceitar propostas');
    }

    if (proposal.status !== 'PENDING' && proposal.status !== 'COUNTERED') {
      throw new BadRequestException('Proposta já foi processada');
    }

    return this.prisma.proposal.update({
      where: { id },
      data: { 
        status: 'ACCEPTED',
        viewedBySender: false,
      },
    });
  }

  async reject(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.receiverId !== userId) {
      throw new ForbiddenException('Apenas o dono da máquina pode recusar propostas');
    }

    if (proposal.status !== 'PENDING' && proposal.status !== 'COUNTERED') {
      throw new BadRequestException('Proposta já foi processada');
    }

    return this.prisma.proposal.update({
      where: { id },
      data: { 
        status: 'REJECTED',
        viewedBySender: false,
      },
    });
  }

  async counter(id: string, userId: string, dto: CounterProposalDto) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.receiverId !== userId) {
      throw new ForbiddenException('Apenas o dono da máquina pode fazer contra-proposta');
    }

    if (proposal.status !== 'PENDING') {
      throw new BadRequestException('Apenas propostas pendentes podem receber contra-proposta');
    }

    return this.prisma.proposal.update({
      where: { id },
      data: {
        status: 'COUNTERED',
        counterPrice: dto.counterPrice,
        counterMessage: dto.counterMessage,
        viewedBySender: false,
      },
    });
  }

  async remove(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.senderId !== userId) {
      throw new ForbiddenException('Apenas o remetente pode cancelar a proposta');
    }

    if (proposal.status !== 'PENDING') {
      throw new BadRequestException('Apenas propostas pendentes podem ser canceladas');
    }

    await this.prisma.proposal.delete({ where: { id } });
    return { message: 'Proposta cancelada com sucesso' };
  }

  async markAsViewed(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    if (proposal.senderId !== userId && proposal.receiverId !== userId) {
      throw new ForbiddenException('Você não tem acesso a esta proposta');
    }

    const updateData: any = {};
    if (proposal.receiverId === userId) {
      updateData.viewedByReceiver = true;
    }
    if (proposal.senderId === userId) {
      updateData.viewedBySender = true;
    }

    return this.prisma.proposal.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        viewedByReceiver: true,
        viewedBySender: true,
        updatedAt: true,
      },
    });
  }
}
