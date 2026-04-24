import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { VerificationService } from './verification.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RequestVerificationSchema, RequestVerificationDto } from './verification.dto';

@ApiTags('verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('request')
  @ApiOperation({ summary: 'Solicitar verificação de vendedor' })
  async request(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(RequestVerificationSchema)) dto: RequestVerificationDto,
  ) {
    return this.verificationService.createRequest(user.userId, dto);
  }
}
