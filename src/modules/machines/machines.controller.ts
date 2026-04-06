import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { MachinesService } from './machines.service';
import {
  CreateMachineDto,
  UpdateMachineDto,
  MachineFiltersDto,
  CreateMachineSchema,
  UpdateMachineSchema,
  MachineFiltersSchema,
} from './dto/machine.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SanitizePipe } from '../../common/pipes/sanitize.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../auth/decorators/auth.decorators';

@ApiTags('machines')
@Controller('machines')
export class MachinesController {
  constructor(private machinesService: MachinesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar nova máquina' })
  @ApiResponse({ status: 201, description: 'Máquina criada com sucesso' })
  async create(
    @CurrentUser() user: any,
    @Body(new SanitizePipe(), new ZodValidationPipe(CreateMachineSchema)) dto: CreateMachineDto,
  ) {
    return this.machinesService.create(user.id, user.name, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar máquinas com filtros' })
  @ApiResponse({ status: 200, description: 'Máquinas recuperadas com sucesso' })
  async findAll(@Query() rawFilters: any) {
    const filters: any = { ...rawFilters };
    
    ['minPrice', 'maxPrice', 'minYear', 'maxYear', 'minEngineHours', 'maxEngineHours', 'minPower', 'maxPower', 'page', 'limit'].forEach(key => {
      if (filters[key]) filters[key] = parseFloat(filters[key]);
    });
    
    ['acceptsTradeDown', 'acceptsTradeUp', 'acceptsGrains', 'isVerifiedSeller'].forEach(key => {
      if (filters[key]) filters[key] = filters[key] === 'true';
    });

    const validated = MachineFiltersSchema.parse(filters);
    return this.machinesService.findAll(validated);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar minhas máquinas' })
  @ApiResponse({ status: 200, description: 'Minhas máquinas recuperadas com sucesso' })
  async findMyMachines(@CurrentUser() user: any) {
    return this.machinesService.findMyMachines(user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Buscar máquina por ID' })
  @ApiResponse({ status: 200, description: 'Máquina encontrada' })
  @ApiResponse({ status: 404, description: 'Máquina não encontrada' })
  async findOne(@Param('id') id: string) {
    return this.machinesService.findOne(id);
  }

  @Post(':id/view')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 3600000 } })
  @ApiOperation({ summary: 'Incrementar visualizações' })
  @ApiResponse({ status: 200, description: 'Visualização registrada' })
  async incrementView(@Param('id') id: string) {
    return this.machinesService.incrementView(id);
  }

  @Post(':id/track-whatsapp')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 por hora
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Track WhatsApp click' })
  @ApiResponse({ status: 200, description: 'Click tracked successfully' })
  async trackWhatsapp(@Param('id') id: string) {
    return this.machinesService.trackWhatsappClick(id);
  }

  @Post(':id/mark-lead')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 por hora
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark qualified lead' })
  @ApiResponse({ status: 200, description: 'Lead marked successfully' })
  async markLead(@Param('id') id: string) {
    return this.machinesService.markQualifiedLead(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar máquina' })
  @ApiResponse({ status: 200, description: 'Máquina atualizada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Máquina não encontrada' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body(new SanitizePipe(), new ZodValidationPipe(UpdateMachineSchema)) dto: UpdateMachineDto,
  ) {
    return this.machinesService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Deletar máquina' })
  @ApiResponse({ status: 200, description: 'Máquina deletada com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Máquina não encontrada' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.machinesService.remove(id, user.id);
  }
}
