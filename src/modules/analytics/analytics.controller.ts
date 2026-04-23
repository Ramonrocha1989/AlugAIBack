import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { AnalyticsService } from './analytics.service';
@ApiTags('analytics')
@Controller('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo analytics do usuário logado' })
  async getSummary(@CurrentUser() user: any) {
    return this.analyticsService.getSummary(user.userId);
  }

  @Get('category-benchmarks')
  @ApiOperation({ summary: 'Benchmarks por categoria (Premium)' })
  @ApiQuery({ name: 'category', type: String })
  async getCategoryBenchmarks(
    @CurrentUser() user: any,
    @Query('category') category: string,
  ) {
    return this.analyticsService.getCategoryBenchmarks(user.userId, category);
  }
}
