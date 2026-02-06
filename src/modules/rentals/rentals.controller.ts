import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RentalsService } from './rentals.service';
import { CreateRentalDto, CreateRentalSchema } from './dto/rental.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@ApiTags('rentals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rentals')
export class RentalsController {
  constructor(private rentalsService: RentalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create rental request' })
  @ApiResponse({ status: 201, description: 'Rental created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateRentalSchema)) dto: CreateRentalDto,
  ) {
    return this.rentalsService.create(user.companyId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my rentals (as renter or owner)' })
  @ApiResponse({ status: 200, description: 'Rentals retrieved successfully' })
  async findMyRentals(@CurrentUser() user: any) {
    return this.rentalsService.findMyRentals(user.companyId);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve rental request' })
  @ApiResponse({ status: 200, description: 'Rental approved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Rental not found' })
  async approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rentalsService.approve(id, user.companyId);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject rental request' })
  @ApiResponse({ status: 200, description: 'Rental rejected successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Rental not found' })
  async reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.rentalsService.reject(id, user.companyId);
  }
}
