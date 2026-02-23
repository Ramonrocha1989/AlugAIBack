import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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
      throw new ConflictException('Email already registered');
    }

    const companyDocument = dto.companyDocument || `DOC-${Date.now()}`;

    const existingCompany = await this.prisma.company.findUnique({
      where: { document: companyDocument },
    });

    if (existingCompany) {
      throw new ConflictException('Company document already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        document: companyDocument,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name || dto.email.split('@')[0],
        email: dto.email,
        password: hashedPassword,
        phone: `55${dto.phone}`,
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

    const token = this.generateToken(user.id, user.email, user.role, '7d');
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
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
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email não verificado. Verifique sua caixa de entrada.');
    }

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
      throw new UnauthorizedException('User not found');
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
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        phone: storedToken.user.phone,
        role: storedToken.user.role,
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
}
