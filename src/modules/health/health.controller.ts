import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check - verifica status de todos os serviços' })
  async check() {
    return this.healthService.check();
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check - verifica se app está pronto para receber tráfego' })
  async ready() {
    return this.healthService.readiness();
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness check - verifica se app está vivo' })
  async live() {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
