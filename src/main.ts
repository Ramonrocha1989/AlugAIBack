import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { LoggerService } from './common/logger.service';
import { SentryInterceptor } from './common/sentry.interceptor';
import { HttpLoggerInterceptor } from './common/http-logger.interceptor';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  validateEnv();

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

  // Cookie Parser — deve vir antes de tudo
  app.use(cookieParser());

  // CORS — deve vir antes do helmet
  const allowedOrigins = [
    'https://baitabriq.com.br',
    'https://www.baitabriq.com.br',
    'https://jovial-cuchufli-4e3662.netlify.app',
  ];

  if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });

  app.enableShutdownHooks();

  app.useGlobalInterceptors(new HttpLoggerInterceptor());

  if (process.env.SENTRY_DSN) {
    app.useGlobalInterceptors(new SentryInterceptor());
  }

  const isProd = process.env.NODE_ENV === 'production';

  app.use(helmet({
    contentSecurityPolicy: isProd ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    hsts: isProd ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,
  }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.setGlobalPrefix('api');

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('BaitaBriq API')
      .setDescription('API B2B para compra, venda e propostas de maquinas')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('companies', 'Company management')
      .addTag('users', 'User profile management')
      .addTag('machines', 'Machine management')
      .addTag('proposals', 'Proposals between companies')
      .addTag('favorites', 'Favorite machines')
      .addTag('reviews', 'User and machine reviews')
      .addTag('notifications', 'User notifications')
      .addTag('plans', 'Subscription plans')
      .addTag('subscriptions', 'Subscription actions')
      .addTag('verification', 'Seller verification flow')
      .addTag('analytics', 'Analytics endpoints')
      .addTag('categories', 'Public categories')
      .addTag('settings', 'Public site settings')
      .addTag('health', 'Health check endpoints')
      .addTag('metrics', 'Application metrics')
      .addTag('admin', 'Admin endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

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

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
    try {
      await app.close();
      console.log('✅ Application closed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap();
