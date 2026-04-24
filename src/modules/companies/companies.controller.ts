import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../auth/decorators/auth.decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UpdateProfileSchema, UpdateProfileDto } from './dto/company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Meu perfil de empresa' })
  async getMyCompany(@CurrentUser() user: any) {
    return this.companiesService.getMyProfile(user.userId);
  }

  @Put('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar perfil da empresa' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    return this.companiesService.updateProfile(user.userId, dto);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Perfil público da empresa' })
  async getCompany(@Param('id') id: string) {
    return this.companiesService.getCompany(id);
  }

  @Get(':id/machines')
  @Public()
  @ApiOperation({ summary: 'Máquinas da empresa' })
  async getCompanyMachines(@Param('id') id: string) {
    return this.companiesService.getCompanyMachines(id);
  }
}
