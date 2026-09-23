import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { accessSecret, refreshSecret } from './auth/auth.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Fail fast instead of silently signing tokens with a secret that is public in the repo.
  accessSecret();
  refreshSecret();

  // Helmet Security Headers
  app.use(helmet());

  // Cookie Parser for httpOnly JWT
  app.use(cookieParser());

  // CORS Configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    }),
  );

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('HopeMind API')
    .setDescription('API REST PWA para Plataforma de Saúde Mental e Match Inteligente (Padrão Prottus)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 HopeMind API rodando em: http://localhost:${port}/api`);
  console.log(`📚 Swagger Documentation em: http://localhost:${port}/api/docs`);
}
bootstrap();
