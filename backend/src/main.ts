import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  if (process.env.NODE_ENV === 'production') {
    const missing = ['JWT_SECRET', 'ADMIN_API_KEY', 'CORS_ORIGINS'].filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(`Missing required production env vars: ${missing.join(', ')}`);
    }
  }

  const app = await NestFactory.create(AppModule);

  // Enable CORS for Flutter apps and Web Admin
  app.enableCors({
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()) : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  // Global Request Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`CholoBhairab Backend Service is running on http://localhost:${port}`);
  logger.log(`WebSocket Gateway active for Real-time InDrive Bidding`);
}

bootstrap();
