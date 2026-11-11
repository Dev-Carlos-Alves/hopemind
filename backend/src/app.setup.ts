import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

export const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

/**
 * Everything the HTTP layer needs besides the modules themselves. Shared by main.ts and the
 * integration tests, so the tests exercise the same pipes, cookies and headers as production.
 */
export function configureApp(app: INestApplication) {
  // Helmet Security Headers
  app.use(helmet());

  // Cookie Parser for httpOnly JWT
  app.use(cookieParser());

  // CORS Configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : DEFAULT_CORS_ORIGINS,
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

  return app;
}
