import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto, UpdateEquipmentDto, CreateEquipmentSchema, UpdateEquipmentSchema } from './dto/equipment.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@ApiTags('equipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('equipments')
export class EquipmentsController {
  constructor(private equipmentsService: EquipmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  async create(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateEquipmentSchema)) dto: CreateEquipmentDto,
  ) {
    return this.equipmentsService.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active equipments' })
  @ApiResponse({ status: 200, description: 'Equipments retrieved successfully' })
  async findAll(
    @Query('location') location?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.equipmentsService.findAll({
      location,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async findOne(@Param('id') id: string) {
    return this.equipmentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update equipment' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(UpdateEquipmentSchema)) dto: UpdateEquipmentDto,
  ) {
    return this.equipmentsService.update(id, user.companyId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete equipment' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.equipmentsService.remove(id, user.companyId);
  }
}
