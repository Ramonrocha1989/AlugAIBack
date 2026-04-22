import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { MachineCategory } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    const machines = await this.prisma.machine.findMany({
      where: { ownerId: userId },
      select: { id: true, views: true, whatsappClicks: true, qualifiedLeads: true, createdAt: true },
    });

    const machineIds = machines.map(m => m.id);

    const [favoritesCount, proposalCounts, firstContactDays] = await Promise.all([
      machineIds.length
        ? this.prisma.favorite.count({ where: { machineId: { in: machineIds } } })
        : 0,
      machineIds.length
        ? this.prisma.proposal.groupBy({
            by: ['status'],
            where: { machineId: { in: machineIds } },
            _count: true,
          })
        : [],
      machineIds.length
        ? this.prisma.proposal.findMany({
            where: { machineId: { in: machineIds } },
            select: { machineId: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
            distinct: ['machineId'],
          })
        : [],
    ]);

    const proposals: Record<string, number> = { pending: 0, accepted: 0, rejected: 0, countered: 0 };
    for (const p of proposalCounts as any[]) {
      proposals[p.status.toLowerCase()] = p._count;
    }

    const totalViews = machines.reduce((s, m) => s + m.views, 0);
    const totalClicks = machines.reduce((s, m) => s + m.whatsappClicks, 0);
    const totalLeads = machines.reduce((s, m) => s + m.qualifiedLeads, 0);
    const machineCount = machines.length || 1;

    let avgDaysToFirstContact = 0;
    if ((firstContactDays as any[]).length) {
      const machineMap = new Map(machines.map(m => [m.id, m.createdAt]));
      const daysArr = (firstContactDays as any[])
        .filter(p => machineMap.has(p.machineId))
        .map(p => (p.createdAt.getTime() - machineMap.get(p.machineId)!.getTime()) / 86400000);
      avgDaysToFirstContact = daysArr.length ? +(daysArr.reduce((a, b) => a + b, 0) / daysArr.length).toFixed(1) : 0;
    }

    return {
      totals: {
        views: totalViews,
        whatsappClicks: totalClicks,
        qualifiedLeads: totalLeads,
        favorites: favoritesCount,
        proposals,
      },
      averages: {
        daysToFirstContact: avgDaysToFirstContact,
        viewsPerMachine: +(totalViews / machineCount).toFixed(1),
        clickRatePercent: totalViews ? +((totalClicks / totalViews) * 100).toFixed(1) : 0,
      },
    };
  }

  async getCategoryBenchmarks(userId: string, category: MachineCategory) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user || !['profissional', 'premium'].includes(user.plan)) {
      throw new ForbiddenException('Recurso disponível apenas para planos Premium/Profissional');
    }

    const [platformAgg, userAgg] = await Promise.all([
      this.prisma.machine.aggregate({
        where: { category, available: true, status: 'ACTIVE' },
        _avg: { views: true, whatsappClicks: true, price: true },
      }),
      this.prisma.machine.aggregate({
        where: { category, ownerId: userId },
        _avg: { views: true, whatsappClicks: true, price: true },
      }),
    ]);

    const pViews = platformAgg._avg.views || 0;
    const pClicks = platformAgg._avg.whatsappClicks || 0;
    const pPrice = platformAgg._avg.price ? Number(platformAgg._avg.price) : 0;
    const uViews = userAgg._avg.views || 0;
    const uClicks = userAgg._avg.whatsappClicks || 0;
    const uPrice = userAgg._avg.price ? Number(userAgg._avg.price) : 0;

    const pClickRate = pViews ? +((pClicks / pViews) * 100).toFixed(1) : 0;
    const uClickRate = uViews ? +((uClicks / uViews) * 100).toFixed(1) : 0;

    return {
      category,
      platformAverage: {
        views: Math.round(pViews),
        whatsappClicks: Math.round(pClicks),
        clickRatePercent: pClickRate,
        averagePrice: Math.round(pPrice),
      },
      userAverage: {
        views: Math.round(uViews),
        whatsappClicks: Math.round(uClicks),
        clickRatePercent: uClickRate,
        averagePrice: Math.round(uPrice),
      },
      comparison: {
        viewsVsPlatform: pViews ? +(uViews / pViews).toFixed(2) : 0,
        clickRateVsPlatform: pClickRate ? +(uClickRate / pClickRate).toFixed(2) : 0,
      },
    };
  }
}
