import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkUptime(),
    ]);

    const [database, memory, uptime] = checks;

    const allHealthy = checks.every(c => c.status === 'fulfilled');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: database.status === 'fulfilled' ? database.value : { status: 'unhealthy', error: (database as any).reason?.message },
        memory: memory.status === 'fulfilled' ? memory.value : { status: 'unhealthy' },
        uptime: uptime.status === 'fulfilled' ? uptime.value : { status: 'unhealthy' },
      },
    };
  }

  async readiness() {
    try {
      await this.checkDatabase();
      return { 
        status: 'ready', 
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      return { 
        status: 'not_ready', 
        timestamp: new Date().toISOString(), 
        error: error.message 
      };
    }
  }

  private async checkDatabase() {
    const start = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime: `${duration}ms`,
    };
  }

  private checkMemory() {
    const used = process.memoryUsage();
    const total = used.heapTotal;
    const usage = (used.heapUsed / total) * 100;

    return {
      status: usage < 90 ? 'healthy' : 'warning',
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(total / 1024 / 1024)}MB`,
      usage: `${usage.toFixed(2)}%`,
    };
  }

  private checkUptime() {
    const uptime = process.uptime();
    return {
      status: 'healthy',
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      uptimeSeconds: Math.floor(uptime),
    };
  }
}
