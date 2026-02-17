import { Controller, Post, Body, Res, HttpStatus, Get } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorators/auth.decorators';
import { WebhooksService } from './webhooks.service';

@Controller('api/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('mercadopago')
  async mercadoPagoWebhook(@Body() body: any, @Res() res: Response) {
    try {
      await this.webhooksService.handleMercadoPagoWebhook(body);
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error: any) {
      console.error('Erro no webhook:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  @Public()
  @Get('mercadopago')
  healthCheck() {
    return { status: 'ok' };
  }
}
