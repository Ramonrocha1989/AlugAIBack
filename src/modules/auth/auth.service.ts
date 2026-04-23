import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { encrypt, decrypt, hashDocument } from '../../common/utils/crypto.util';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestDeleteDto, ConfirmDeleteDto } from './dto/delete-account.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const isIndividual = dto.userType === 'INDIVIDUAL';
    const rawDocument = isIndividual ? dto.cpf : dto.cnpj;
    const companyDocument = rawDocument || `DOC-${Date.now()}`;
    const docHash = hashDocument(companyDocument);

    if (rawDocument) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { documentHash: docHash },
      });

      if (existingCompany) {
        throw new ConflictException('CPF/CNPJ já cadastrado');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const userName = isIndividual ? dto.fullName : dto.companyName;
    if (!userName) {
      throw new BadRequestException('Nome obrigatório');
    }

    const company = await this.prisma.company.create({
      data: {
        name: userName,
        document: encrypt(companyDocument),
        documentHash: docHash,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        name: userName,
        email: dto.email,
        password: hashedPassword,
        phone: `55${dto.phone}`,
        userType: dto.userType,
        fullName: dto.fullName,
        cpf: dto.cpf ? encrypt(dto.cpf) : undefined,
        responsibleName: dto.responsibleName,
        companyId: company.id,
        role: 'COMPANY',
      },
      include: {
        company: true,
      },
    });

    const verificationToken = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    const token = this.generateToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userType: user.userType,
        plan: user.plan,
        emailVerified: user.emailVerified,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          document: user.company.document,
        } : null,
      },
      accessToken: token,
      refreshToken,
      message: 'Cadastro realizado! Verifique seu email para ativar sua conta.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email não verificado. Verifique sua caixa de entrada.');
    }

    if (user.status === 'DELETED') {
      throw new ForbiddenException('Sua conta foi marcada para exclusão. Entre em contato com o suporte.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.generateToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user.id, refreshToken);

    // Buscar contadores de uso
    const [activeAds, premiumAds, featuredAds] = await Promise.all([
      this.prisma.machine.count({
        where: { ownerId: user.id, available: true, status: 'ACTIVE' },
      }),
      this.prisma.machine.count({
        where: { ownerId: user.id, isPremium: true, available: true, status: 'ACTIVE' },
      }),
      this.prisma.machine.count({
        where: { ownerId: user.id, isFeatured: true, available: true, status: 'ACTIVE' },
      }),
    ]);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userType: user.userType,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        maxAds: user.maxAds,
        maxPremiumAds: user.maxPremiumAds,
        maxFeaturedAds: user.maxFeaturedAds,
        isVerifiedSeller: user.isVerifiedSeller,
        emailVerified: user.emailVerified,
        company: user.company ? {
          id: user.company.id,
          name: user.company.name,
          document: user.company.document,
        } : null,
        usage: {
          activeAds,
          premiumAds,
          featuredAds,
        },
      },
      accessToken,
      refreshToken,
    };
  }

  private generateToken(userId: string, email: string, role: string, expiresIn = '15m') {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    }, { expiresIn });
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    return this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'Email de recuperação enviado com sucesso' };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, token);

    return { message: 'Email de recuperação enviado com sucesso' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: dto.token,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const verificationToken = await this.prisma.emailVerificationToken.findFirst({
      where: {
        token: dto.token,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    if (!verificationToken) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Email verificado com sucesso' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        userType: true,
        plan: true,
        planExpiresAt: true,
        maxAds: true,
        maxPremiumAds: true,
        maxFeaturedAds: true,
        isVerifiedSeller: true,
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
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const [activeAds, premiumAds, featuredAds] = await Promise.all([
      this.prisma.machine.count({
        where: { ownerId: userId, available: true, status: 'ACTIVE' },
      }),
      this.prisma.machine.count({
        where: { ownerId: userId, isPremium: true, available: true, status: 'ACTIVE' },
      }),
      this.prisma.machine.count({
        where: { ownerId: userId, isFeatured: true, available: true, status: 'ACTIVE' },
      }),
    ]);

    return {
      ...user,
      userType: user.userType,
      usage: {
        activeAds,
        premiumAds,
        featuredAds,
      },
    };
  }

  async upgradePlan(userId: string, plan: string) {
    const planLimits = {
      free: { maxAds: 3, maxPremiumAds: 0, maxFeaturedAds: 0 },
      lojista: { maxAds: 999, maxPremiumAds: 3, maxFeaturedAds: 5 },
    };

    const limits = planLimits[plan];
    if (!limits) {
      throw new BadRequestException('Plano inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        ...limits,
      },
    });

    return {
      message: `Plano atualizado para ${plan} com sucesso`,
      plan,
      limits,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { company: true } } },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Rotação: invalidar token antigo e gerar novo (deleteMany evita race condition)
    const deleted = await this.prisma.refreshToken.deleteMany({ where: { id: storedToken.id } });

    if (deleted.count === 0) {
      throw new UnauthorizedException('Refresh token já utilizado');
    }

    const newRefreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(storedToken.user.id, newRefreshToken);

    const accessToken = this.generateToken(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    const [activeAds, premiumAds, featuredAds] = await Promise.all([
      this.prisma.machine.count({
        where: { ownerId: storedToken.user.id, available: true, status: 'ACTIVE' },
      }),
      this.prisma.machine.count({
        where: { ownerId: storedToken.user.id, isPremium: true, available: true, status: 'ACTIVE' },
      }),
      this.prisma.machine.count({
        where: { ownerId: storedToken.user.id, isFeatured: true, available: true, status: 'ACTIVE' },
      }),
    ]);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        phone: storedToken.user.phone,
        role: storedToken.user.role,
        userType: storedToken.user.userType,
        plan: storedToken.user.plan,
        planExpiresAt: storedToken.user.planExpiresAt,
        maxAds: storedToken.user.maxAds,
        maxPremiumAds: storedToken.user.maxPremiumAds,
        maxFeaturedAds: storedToken.user.maxFeaturedAds,
        isVerifiedSeller: storedToken.user.isVerifiedSeller,
        emailVerified: storedToken.user.emailVerified,
        company: storedToken.user.company ? {
          id: storedToken.user.company.id,
          name: storedToken.user.company.name,
          document: storedToken.user.company.document,
        } : null,
        usage: {
          activeAds,
          premiumAds,
          featuredAds,
        },
      },
    };
  }

  async logout(userId: string, refreshToken?: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        ...(refreshToken && { token: refreshToken }),
      },
    });
  }

  async updateProfile(userId: string, updateData: { name?: string; phone?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.phone && { phone: updateData.phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        plan: true,
        emailVerified: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { message: 'Perfil atualizado com sucesso', user };
  }

  async requestDelete(userId: string, dto: RequestDeleteDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 86400000); // 24h

    await this.prisma.deleteToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    await this.emailService.sendDeleteConfirmationEmail(user.email, user.name, token);

    return { message: 'Email de confirmação enviado' };
  }

  async confirmDelete(dto: ConfirmDeleteDto) {
    const deleteToken = await this.prisma.deleteToken.findFirst({
      where: {
        token: dto.token,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!deleteToken) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    await this.prisma.user.update({
      where: { id: deleteToken.userId },
      data: {
        deletedAt: new Date(),
        status: 'DELETED',
      },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId: deleteToken.userId },
    });

    await this.prisma.deleteToken.delete({
      where: { id: deleteToken.id },
    });

    // Limpar company órfã se não houver mais users ativos
    if (deleteToken.user.companyId) {
      const remainingUsers = await this.prisma.user.count({
        where: { companyId: deleteToken.user.companyId, status: { not: 'DELETED' } },
      });
      if (remainingUsers === 0) {
        await this.prisma.company.delete({ where: { id: deleteToken.user.companyId } });
      }
    }

    await this.emailService.sendDeletedAccountEmail(
      deleteToken.user.email,
      deleteToken.user.name,
      deletionDate,
    );

    return { message: 'Conta marcada para exclusão' };
  }
}
