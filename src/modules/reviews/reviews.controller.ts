import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, HttpCode, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, CreateReviewSchema, UpdateReviewSchema } from './dto/review.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SanitizePipe } from '../../common/pipes/sanitize.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../auth/decorators/auth.decorators';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar avaliação' })
  @ApiResponse({ status: 201, description: 'Avaliação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Não pode avaliar a si mesmo' })
  @ApiResponse({ status: 409, description: 'Você já avaliou esta transação' })
  async create(
    @CurrentUser() user: any,
    @Body(new SanitizePipe(), new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.userId, dto);
  }

  @Get('user/:userId')
  @Public()
  @ApiOperation({ summary: 'Listar avaliações recebidas por um usuário' })
  @ApiResponse({ status: 200, description: 'Avaliações recuperadas com sucesso' })
  async findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reviewsService.findByUser(userId);
  }

  @Get('machine/:machineId')
  @Public()
  @ApiOperation({ summary: 'Listar avaliações de uma máquina' })
  @ApiResponse({ status: 200, description: 'Avaliações recuperadas com sucesso' })
  async findByMachine(@Param('machineId', ParseUUIDPipe) machineId: string) {
    return this.reviewsService.findByMachine(machineId);
  }

  @Get('user/:userId/rating')
  @Public()
  @ApiOperation({ summary: 'Obter estatísticas de avaliação de um usuário' })
  @ApiResponse({ status: 200, description: 'Estatísticas recuperadas com sucesso' })
  async getUserRating(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reviewsService.getUserRating(userId);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Editar avaliação (até 7 dias)' })
  @ApiResponse({ status: 200, description: 'Avaliação atualizada com sucesso' })
  @ApiResponse({ status: 403, description: 'Não pode editar após 7 dias ou não é o autor' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body(new SanitizePipe(), new ZodValidationPipe(UpdateReviewSchema)) dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar avaliação' })
  @ApiResponse({ status: 204, description: 'Avaliação deletada com sucesso' })
  @ApiResponse({ status: 403, description: 'Você não pode deletar esta avaliação' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    await this.reviewsService.remove(id, user.userId);
  }
}
