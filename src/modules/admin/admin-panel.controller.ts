import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin-panel.service';
import { 
  BanUserDto, VerifySellerDto, UpdateMachineStatusDto, FeatureMachineDto, 
  UpdateSettingsDto, CreateBannerDto, UpdateUserPlanDto,
  BanUserSchema, VerifySellerSchema, UpdateMachineStatusSchema, FeatureMachineSchema,
  UpdateSettingsSchema, CreateBannerSchema, UpdateUserPlanSchema
} from './dto/admin.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminPanelController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard - Estatísticas gerais' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar usuários' })
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
    @Query('userType') userType?: string,
  ) {
    return this.adminService.getUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
      plan,
      status,
      userType,
    );
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Banir/Desbanir usuário' })
  async banUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(BanUserSchema)) dto: BanUserDto,
  ) {
    return this.adminService.banUser(id, dto);
  }

  @Patch('users/:id/verify')
  @ApiOperation({ summary: 'Verificar vendedor' })
  async verifyUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(VerifySellerSchema)) dto: VerifySellerDto,
  ) {
    return this.adminService.verifyUser(id, dto);
  }

  @Get('machines')
  @ApiOperation({ summary: 'Listar máquinas (admin)' })
  async getMachines(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getMachines(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  @Patch('machines/:id/status')
  @ApiOperation({ summary: 'Aprovar/Reprovar máquina' })
  async updateMachineStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateMachineStatusSchema)) dto: UpdateMachineStatusDto,
  ) {
    return this.adminService.updateMachineStatus(id, dto);
  }

  @Patch('machines/:id/feature')
  @ApiOperation({ summary: 'Destacar máquina' })
  async featureMachine(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(FeatureMachineSchema)) dto: FeatureMachineDto,
  ) {
    return this.adminService.featureMachine(id, dto);
  }

  @Delete('machines/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar máquina (admin)' })
  async deleteMachine(@Param('id') id: string) {
    return this.adminService.deleteMachine(id);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Listar avaliações' })
  async getReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReviews(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Delete('reviews/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar avaliação' })
  async deleteReview(@Param('id') id: string) {
    return this.adminService.deleteReview(id);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Buscar configurações do site' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Post('settings')
  @ApiOperation({ summary: 'Atualizar configurações' })
  async updateSettings(
    @Body(new ZodValidationPipe(UpdateSettingsSchema)) dto: UpdateSettingsDto,
  ) {
    return this.adminService.updateSettings(dto);
  }

  @Post('banners')
  @ApiOperation({ summary: 'Criar banner' })
  async createBanner(
    @Body(new ZodValidationPipe(CreateBannerSchema)) dto: CreateBannerDto,
  ) {
    return this.adminService.createBanner(dto);
  }

  @Delete('banners/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar banner' })
  async deleteBanner(@Param('id') id: string) {
    return this.adminService.deleteBanner(id);
  }

  @Patch('users/:id/plan')
  @ApiOperation({ summary: 'Alterar plano do usuário' })
  async updateUserPlan(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserPlanSchema)) dto: UpdateUserPlanDto,
  ) {
    return this.adminService.updateUserPlan(id, dto);
  }
}
