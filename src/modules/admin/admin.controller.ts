import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('rentals')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all rentals (Admin only)' })
  @ApiResponse({ status: 200, description: 'Rentals retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllRentals() {
    return this.adminService.getAllRentals();
  }
}
