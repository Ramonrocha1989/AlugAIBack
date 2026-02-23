import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    const [
      totalUsers,
      totalMachines,
      totalProposals,
      activeMachines,
      premiumUsers,
      totalFavorites,
      totalReviews,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.machine.count(),
      this.prisma.proposal.count(),
      this.prisma.machine.count({ where: { available: true } }),
      this.prisma.user.count({ where: { plan: 'lojista' } }),
      this.prisma.favorite.count(),
      this.prisma.review.count(),
    ]);

    const memory = process.memoryUsage();
    const uptime = process.uptime();

    return {
      timestamp: new Date().toISOString(),
      system: {
        uptime: Math.floor(uptime),
        uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
          rss: Math.round(memory.rss / 1024 / 1024),
          external: Math.round(memory.external / 1024 / 1024),
        },
        nodeVersion: process.version,
        platform: process.platform,
      },
      business: {
        users: {
          total: totalUsers,
          premium: premiumUsers,
          free: totalUsers - premiumUsers,
          conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(2) + '%' : '0%',
        },
        machines: {
          total: totalMachines,
          active: activeMachines,
          inactive: totalMachines - activeMachines,
        },
        engagement: {
          proposals: totalProposals,
          favorites: totalFavorites,
          reviews: totalReviews,
        },
      },
    };
  }
}
