import { Controller, Post, Body, Res, HttpStatus, Get, Headers, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { Public } from '../auth/decorators/auth.decorators';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Public()
  @Post('mercadopago')
  async mercadoPagoWebhook(
    @Body() body: any,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const dataId = (req.query['data.id'] as string) || body?.data?.id?.toString();
      this.webhooksService.validateSignature(xSignature, xRequestId, dataId);
      await this.webhooksService.handleMercadoPagoWebhook(body);
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error: any) {
      console.error('Erro no webhook:', error.message);
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Assinatura inválida' });
    }
  }

  @Public()
  @Get('mercadopago')
  healthCheck() {
    return { status: 'ok' };
  }
}
