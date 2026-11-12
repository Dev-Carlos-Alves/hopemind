import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { accessSecret, refreshSecret } from './auth/auth.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Fail fast instead of silently signing tokens with a secret that is public in the repo.
  accessSecret();
  refreshSecret();

  configureApp(app);

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
