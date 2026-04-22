import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/auth.decorators';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel active subscription' })
  async cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancel(user.id);
  }
}
