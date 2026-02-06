import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateRentalDto } from './dto/rental.dto';

@Injectable()
export class RentalsService {
  constructor(private prisma: PrismaService) {}

  async create(renterCompanyId: string, dto: CreateRentalDto) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    if (!equipment.isActive) {
      throw new BadRequestException('Equipment is not available');
    }

    if (equipment.companyId === renterCompanyId) {
      throw new BadRequestException('Cannot rent your own equipment');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = Number(equipment.pricePerDay) * days;

    const rental = await this.prisma.rental.create({
      data: {
        equipmentId: dto.equipmentId,
        renterCompanyId,
        startDate,
        endDate,
        status: 'PENDING',
      },
      include: {
        equipment: {
          include: {
            company: true,
          },
        },
        renterCompany: true,
      },
    });

    // Mock payment creation
    await this.prisma.payment.create({
      data: {
        rentalId: rental.id,
        amount,
        status: 'PENDING',
      },
    });

    return rental;
  }

  async findMyRentals(companyId: string) {
    return this.prisma.rental.findMany({
      where: {
        OR: [
          { renterCompanyId: companyId },
          { equipment: { companyId } },
        ],
      },
      include: {
        equipment: {
          include: {
            company: true,
          },
        },
        renterCompany: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, ownerCompanyId: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: {
        equipment: true,
        payment: true,
      },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    if (rental.equipment.companyId !== ownerCompanyId) {
      throw new ForbiddenException('Only equipment owner can approve rentals');
    }

    if (rental.status !== 'PENDING') {
      throw new BadRequestException('Rental is not pending');
    }

    const updatedRental = await this.prisma.rental.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        equipment: {
          include: {
            company: true,
          },
        },
        renterCompany: true,
        payment: true,
      },
    });

    // Mock payment approval
    if (!rental.payment) {
      throw new BadRequestException('Payment not found');
    }

    await this.prisma.payment.update({
      where: { id: rental.payment.id },
      data: { status: 'PAID' },
    });

    return updatedRental;
  }

  async reject(id: string, ownerCompanyId: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: {
        equipment: true,
      },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    if (rental.equipment.companyId !== ownerCompanyId) {
      throw new ForbiddenException('Only equipment owner can reject rentals');
    }

    if (rental.status !== 'PENDING') {
      throw new BadRequestException('Rental is not pending');
    }

    return this.prisma.rental.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        equipment: {
          include: {
            company: true,
          },
        },
        renterCompany: true,
        payment: true,
      },
    });
  }
}
