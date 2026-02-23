import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Application metrics - métricas de negócio e sistema' })
  async getMetrics() {
    return this.metricsService.getMetrics();
  }
}
