import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { PrismaService } from './prisma.service';

/**
 * EXEMPLO: Como usar o Logger em seus services
 * 
 * Este é um exemplo de como integrar o LoggerService
 * em qualquer service da aplicação.
 */

@Injectable()
export class ExampleService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async createMachine(data: any) {
    try {
      this.logger.log(
        `Creating machine: ${data.name}`,
        'ExampleService'
      );

      const machine = await this.prisma.machine.create({
        data,
      });

      this.logger.log(
        `Machine created successfully: ${machine.id}`,
        'ExampleService'
      );

      return machine;
    } catch (error) {
      this.logger.error(
        `Failed to create machine: ${error.message}`,
        error.stack,
        'ExampleService'
      );
      throw error;
    }
  }

  async processPayment(userId: string, amount: number) {
    this.logger.log(
      `Processing payment for user ${userId}, amount: ${amount}`,
      'ExampleService'
    );

    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.logger.log(
        `Payment processed successfully for user ${userId}`,
        'ExampleService'
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Payment failed for user ${userId}`,
        error.stack,
        'ExampleService'
      );
      throw error;
    }
  }

  async sendNotification(userId: string, message: string) {
    this.logger.log(
      `Sending notification to user ${userId}`,
      'ExampleService'
    );

    // Avisos não críticos
    if (!message) {
      this.logger.warn(
        `Empty message for notification to user ${userId}`,
        'ExampleService'
      );
      return;
    }

    // Debug (só aparece em desenvolvimento)
    this.logger.debug(
      `Notification content: ${message}`,
      'ExampleService'
    );

    // Enviar notificação...
  }
}

/**
 * COMO ADICIONAR EM SEUS SERVICES EXISTENTES:
 * 
 * 1. Importar o LoggerService:
 *    import { LoggerService } from '../../common/logger.service';
 * 
 * 2. Injetar no constructor:
 *    constructor(private logger: LoggerService) {}
 * 
 * 3. Usar nos métodos:
 *    this.logger.log('Mensagem', 'NomeDoService');
 *    this.logger.error('Erro', error.stack, 'NomeDoService');
 *    this.logger.warn('Aviso', 'NomeDoService');
 * 
 * 4. Adicionar no module providers (se necessário):
 *    providers: [ExampleService, LoggerService]
 */
