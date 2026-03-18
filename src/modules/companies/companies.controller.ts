import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../auth/decorators/auth.decorators';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my company details' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getMyCompany(@CurrentUser() user: any) {
    return this.companiesService.getMyCompany(user.companyId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Dados da empresa' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  async getCompany(@Param('id') id: string) {
    return this.companiesService.getCompany(id);
  }

  @Get(':id/machines')
  @Public()
  @ApiOperation({ summary: 'Máquinas da empresa' })
  @ApiResponse({ status: 200, description: 'Máquinas recuperadas' })
  async getCompanyMachines(@Param('id') id: string) {
    return this.companiesService.getCompanyMachines(id);
  }
}
