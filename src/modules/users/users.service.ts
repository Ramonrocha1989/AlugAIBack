import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { decrypt } from '../../common/utils/crypto.util';
import { UpdateProfileDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        company: {
          select: {
            id: true,
            name: true,
            document: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.company?.document) {
      user.company.document = decrypt(user.company.document);
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.phone) data.phone = `55${dto.phone}`;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        company: {
          select: {
            id: true,
            name: true,
            document: true,
          },
        },
      },
    });

    if (user.company?.document) {
      user.company.document = decrypt(user.company.document);
    }

    return user;
  }
}
