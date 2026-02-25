import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto, CounterProposalDto, CreateProposalSchema, CounterProposalSchema } from './dto/proposal.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SanitizePipe } from '../../common/pipes/sanitize.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';

@ApiTags('proposals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar proposta' })
  @ApiResponse({ status: 201, description: 'Proposta criada com sucesso' })
  async create(
    @CurrentUser() user: any,
    @Body(new SanitizePipe(), new ZodValidationPipe(CreateProposalSchema)) dto: CreateProposalDto,
  ) {
    return this.proposalsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar propostas' })
  @ApiResponse({ status: 200, description: 'Propostas recuperadas com sucesso' })
  async findAll(
    @CurrentUser() user: any,
    @Query('type') type: 'sent' | 'received' = 'received',
  ) {
    return this.proposalsService.findAll(user.userId, type);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Aceitar proposta' })
  @ApiResponse({ status: 200, description: 'Proposta aceita' })
  async accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalsService.accept(id, user.userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Recusar proposta' })
  @ApiResponse({ status: 200, description: 'Proposta recusada' })
  async reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalsService.reject(id, user.userId);
  }

  @Patch(':id/counter')
  @ApiOperation({ summary: 'Fazer contra-proposta' })
  @ApiResponse({ status: 200, description: 'Contra-proposta enviada' })
  async counter(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body(new SanitizePipe(), new ZodValidationPipe(CounterProposalSchema)) dto: CounterProposalDto,
  ) {
    return this.proposalsService.counter(id, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancelar proposta' })
  @ApiResponse({ status: 204, description: 'Proposta cancelada' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalsService.remove(id, user.userId);
  }

  @Patch(':id/view')
  @ApiOperation({ summary: 'Marcar proposta como vista' })
  @ApiResponse({ status: 200, description: 'Proposta marcada como vista' })
  async markAsViewed(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalsService.markAsViewed(id, user.userId);
  }
}
