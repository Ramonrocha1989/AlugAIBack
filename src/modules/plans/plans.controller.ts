import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all available plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  findAll() {
    return this.plansService.findAll();
  }
}
