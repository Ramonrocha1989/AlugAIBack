import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { LoggerService } from './common/logger.service';
import { SentryInterceptor } from './common/sentry.interceptor';

async function bootstrap() {
  // Inicializar Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    console.log('✅ Sentry initialized');
  }

  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });

  // Sentry Interceptor Global
  if (process.env.SENTRY_DSN) {
    app.useGlobalInterceptors(new SentryInterceptor());
  }

  // Cookie Parser
  app.use(cookieParser());

  // CORS PRIMEIRO (antes de tudo)
  app.enableCors({
    origin: [
      'https://mercadomaquina.online',
      'https://www.mercadomaquina.online',
      'https://jovial-cuchufli-4e3662.netlify.app',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Equipment Rental Marketplace API')
    .setDescription('B2B Equipment Rental Marketplace - MVP')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('companies', 'Company management')
    .addTag('equipments', 'Equipment management')
    .addTag('rentals', 'Rental management')
    .addTag('admin', 'Admin endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`🔒 Security: Cookies + CSRF + Rate Limiting enabled`);
  console.log(`🏥 Health check: http://localhost:${port}/api/health`);
  console.log(`📊 Metrics: http://localhost:${port}/api/metrics`);
  
  if (process.env.SENTRY_DSN) {
    console.log(`🔍 Sentry: Error tracking enabled`);
  }
  
  if (process.env.BETTERSTACK_TOKEN) {
    console.log(`📝 BetterStack: Logs enabled`);
  }
}

bootstrap();
