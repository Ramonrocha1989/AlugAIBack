import { Controller, Post, Delete, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto, AddFavoriteSchema } from './dto/favorite.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@ApiTags('favorites')
@Controller('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar máquina aos favoritos' })
  @ApiResponse({ status: 201, description: 'Favorito adicionado com sucesso' })
  @ApiResponse({ status: 409, description: 'Máquina já está nos favoritos' })
  async addFavorite(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(AddFavoriteSchema)) dto: AddFavoriteDto,
  ) {
    return this.favoritesService.addFavorite(user.userId, dto.machineId);
  }

  @Delete(':machineId')
  @ApiOperation({ summary: 'Remover máquina dos favoritos' })
  @ApiResponse({ status: 200, description: 'Favorito removido com sucesso' })
  async removeFavorite(
    @CurrentUser() user: any,
    @Param('machineId') machineId: string,
  ) {
    await this.favoritesService.removeFavorite(user.userId, machineId);
    return { message: 'Favorito removido com sucesso' };
  }

  @Get()
  @ApiOperation({ summary: 'Listar favoritos do usuário' })
  @ApiResponse({ status: 200, description: 'Favoritos recuperados com sucesso' })
  async getFavorites(@CurrentUser() user: any) {
    return this.favoritesService.getFavorites(user.userId);
  }

  @Get('check/:machineId')
  @ApiOperation({ summary: 'Verificar se máquina está favoritada' })
  @ApiResponse({ status: 200, description: 'Status de favorito verificado' })
  async isFavorited(
    @CurrentUser() user: any,
    @Param('machineId') machineId: string,
  ) {
    return this.favoritesService.isFavorited(user.userId, machineId);
  }
}
