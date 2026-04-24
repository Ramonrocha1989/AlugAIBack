import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { BanUserDto, VerifySellerDto, UpdateMachineStatusDto, FeatureMachineDto, UpdateSettingsDto, CreateBannerDto, UpdateUserPlanDto, CreateCategoryDto, UpdateCategoryDto, ReorderCategoryDto, UpdatePlanDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private getLast6Months(): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [totalUsers, totalMachines, totalProposals, totalReviews, pendingMachines, newUsersThisMonth, newMachinesThisMonth] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.machine.count(),
      this.prisma.proposal.count(),
      this.prisma.review.count(),
      this.prisma.machine.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.machine.count({ where: { createdAt: { gte: startOfMonth } } }),
    ]);

    const recentActivity = await this.prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true },
    });

    const [usersRaw, machinesRaw, revenueRaw] = await Promise.all([
      this.prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
        FROM users WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY month ORDER BY month`,
      this.prisma.$queryRaw<{ month: string; count: number }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::int as count
        FROM machines WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY month ORDER BY month`,
      this.prisma.$queryRaw<{ month: string; amount: number }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COALESCE(SUM(amount), 0)::float as amount
        FROM payments WHERE status = 'approved' AND "createdAt" >= ${sixMonthsAgo}
        GROUP BY month ORDER BY month`,
    ]);

    const paymentStatsRaw = await this.prisma.$queryRaw<{ status: string; count: number; total: number }[]>`
      SELECT status, COUNT(*)::int as count, COALESCE(SUM(amount), 0)::float as total
      FROM payments GROUP BY status`;

    const allStatuses = ['approved', 'pending', 'rejected', 'cancelled', 'refunded', 'in_process'];
    const paymentStatsMap = Object.fromEntries(paymentStatsRaw.map(r => [r.status, { count: r.count, total: r.total }]));
    const payments = Object.fromEntries(allStatuses.map(s => [s, paymentStatsMap[s] || { count: 0, total: 0 }]));

    const months = this.getLast6Months();
    const usersMap = Object.fromEntries(usersRaw.map(r => [r.month, r.count]));
    const machinesMap = Object.fromEntries(machinesRaw.map(r => [r.month, r.count]));
    const revenueMap = Object.fromEntries(revenueRaw.map(r => [r.month, r.amount]));

    return {
      totalUsers,
      totalMachines,
      totalProposals,
      totalReviews,
      pendingMachines,
      newUsersThisMonth,
      newMachinesThisMonth,
      recentActivity: recentActivity.map(u => ({
        type: 'USER_REGISTERED',
        userName: u.name,
        description: 'Novo usuário cadastrado',
        createdAt: u.createdAt,
      })),
      payments,
      charts: {
        users: months.map(m => ({ month: m, count: usersMap[m] || 0 })),
        machines: months.map(m => ({ month: m, count: machinesMap[m] || 0 })),
        revenue: months.map(m => ({ month: m, amount: revenueMap[m] || 0 })),
      },
    };
  }

  async getUsers(page: number = 1, limit: number = 20, search?: string, plan?: string, status?: string, userType?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan) where.plan = plan;
    if (status === 'BANNED') where.isBanned = true;
    if (status === 'ACTIVE') where.isBanned = false;
    if (userType) where.userType = userType;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
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
          maxPhotos: true,
          maxVideos: true,
          maxPremiumAds: true,
          maxFeaturedAds: true,
          emailVerified: true,
          isBanned: true,
          isVerifiedSeller: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          company: { select: { id: true, name: true } },
          _count: {
            select: {
              machines: true,
              proposalsSent: true,
              reviewsGiven: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async banUser(id: string, dto: BanUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isBanned: dto.isBanned },
      select: { id: true, name: true, email: true, isBanned: true },
    });

    if (dto.isBanned) {
      await this.prisma.machine.updateMany({
        where: { ownerId: id },
        data: { available: false },
      });
    }

    return user;
  }

  async verifyUser(id: string, dto: VerifySellerDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isVerifiedSeller: dto.isVerifiedSeller },
      select: { id: true, name: true, email: true, isVerifiedSeller: true },
    });

    await this.prisma.machine.updateMany({
      where: { ownerId: id },
      data: { isVerifiedSeller: dto.isVerifiedSeller },
    });

    return user;
  }

  async getMachines(page: number = 1, limit: number = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [machines, total] = await Promise.all([
      this.prisma.machine.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.machine.count({ where }),
    ]);

    return {
      machines,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateMachineStatus(id: string, dto: UpdateMachineStatusDto) {
    return this.prisma.machine.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async featureMachine(id: string, dto: FeatureMachineDto) {
    return this.prisma.machine.update({
      where: { id },
      data: { isFeatured: dto.isFeatured },
    });
  }

  async deleteMachine(id: string) {
    await this.prisma.machine.delete({ where: { id } });
    return { message: 'Máquina deletada com sucesso' };
  }

  async getReviews(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        include: {
          reviewer: {
            select: { id: true, name: true },
          },
          reviewedUser: {
            select: { id: true, name: true },
          },
          machine: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count(),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteReview(id: string) {
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Avaliação deletada com sucesso' };
  }

  async getSettings() {
    const [settings, banners] = await Promise.all([
      this.prisma.siteSetting.findFirst(),
      this.prisma.banner.findMany({ orderBy: { orderIndex: 'asc' } }),
    ]);

    return {
      siteName: settings?.siteName || 'BaitaBriq',
      homeTitle: settings?.homeTitle || '',
      homeDescription: settings?.homeDescription || '',
      maintenanceMode: settings?.maintenanceMode || false,
      maintenanceMessage: settings?.maintenanceMessage || 'Estamos em manutenção, voltamos em breve!',
      whatsappSupport: settings?.whatsappSupport || '5553984590461',
      phoneSupport: settings?.phoneSupport || '(53) 98459-0461',
      emailSupport: settings?.emailSupport || 'contato@baitabriq.com.br',
      socialLinks: settings?.socialLinks || { instagram: '', facebook: '', youtube: '', linkedin: '' },
      termsOfUse: settings?.termsOfUse || '',
      privacyPolicy: settings?.privacyPolicy || '',
      banners,
    };
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const existing = await this.prisma.siteSetting.findFirst();
    const data: any = { ...dto };
    if (dto.socialLinks) data.socialLinks = dto.socialLinks;

    if (existing) {
      return this.prisma.siteSetting.update({ where: { id: existing.id }, data });
    }
    return this.prisma.siteSetting.create({ data });
  }

  async createBanner(dto: CreateBannerDto) {
    const maxOrder = await this.prisma.banner.findFirst({
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    return this.prisma.banner.create({
      data: {
        ...dto,
        orderIndex: (maxOrder?.orderIndex || 0) + 1,
      },
    });
  }

  async deleteBanner(id: string) {
    await this.prisma.banner.delete({ where: { id } });
    return { message: 'Banner deletado com sucesso' };
  }

  async updateUserPlan(userId: string, dto: UpdateUserPlanDto) {
    const plan = await this.prisma.plan.findUniqueOrThrow({ where: { id: dto.plan } });

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: dto.plan,
        planExpiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        maxAds: plan.maxAds,
        maxPhotos: plan.maxPhotos,
        maxVideos: plan.maxVideos,
        maxPremiumAds: plan.maxPremiumAds,
        maxFeaturedAds: plan.maxFeaturedAds,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        planExpiresAt: true,
        maxAds: true,
        maxPhotos: true,
        maxVideos: true,
        maxPremiumAds: true,
        maxFeaturedAds: true,
      },
    });
  }

  // === CATEGORIES ===

  async getCategories() {
    const categories = await this.prisma.category.findMany({ orderBy: { order: 'asc' } });
    const counts = await this.prisma.machine.groupBy({
      by: ['category'],
      _count: true,
    });
    const countMap = Object.fromEntries(counts.map(c => [c.category, c._count]));

    return categories.map(cat => ({
      ...cat,
      machineCount: countMap[cat.slug] || 0,
    }));
  }

  async createCategory(dto: CreateCategoryDto) {
    const maxOrder = await this.prisma.category.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.category.create({
      data: { ...dto, order: (maxOrder?.order || 0) + 1 },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Categoria deletada com sucesso' };
  }

  async reorderCategory(id: string, dto: ReorderCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: { order: dto.order } });
  }

  // === PLANS ===

  async getPlans() {
    return this.prisma.plan.findMany({ orderBy: { price: 'asc' } });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  // === VERIFICATION REQUESTS ===

  async getVerificationRequests(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      this.prisma.verificationRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, isVerifiedSeller: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.verificationRequest.count({ where }),
    ]);

    return {
      data: requests.map(r => ({
        id: r.id,
        userId: r.userId,
        userName: r.user.name,
        userEmail: r.user.email,
        documentType: r.documentType,
        documentNumber: r.documentNumber,
        companyName: r.companyName,
        phone: r.phone,
        email: r.email,
        reason: r.reason,
        status: r.status,
        rejectReason: r.rejectReason,
        createdAt: r.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveVerification(id: string) {
    const request = await this.prisma.verificationRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await this.prisma.user.update({
      where: { id: request.userId },
      data: { isVerifiedSeller: true },
    });

    await this.prisma.machine.updateMany({
      where: { ownerId: request.userId },
      data: { isVerifiedSeller: true },
    });

    return { message: 'Vendedor verificado com sucesso' };
  }

  async rejectVerification(id: string, reason?: string) {
    await this.prisma.verificationRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectReason: reason || null },
    });

    return { message: 'Solicitação rejeitada' };
  }
}
