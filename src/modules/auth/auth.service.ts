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

    // Gerar token de verificação
    const verificationToken = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 86400000), // 24 horas
      },
    });

    // Enviar email de verificação
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
      token,
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

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
      token,
    };
  }

  private generateToken(userId: string, email: string, role: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Sempre retorna sucesso (segurança)
    if (!user) {
      return { message: 'Email de recuperação enviado com sucesso' };
    }

    // Gerar token único
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Enviar email
    await this.emailService.sendPasswordResetEmail(user.email, token);

    return { message: 'Email de recuperação enviado com sucesso' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Buscar token válido
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

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Atualizar senha do usuário
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Marcar token como usado
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
}
