// Load .env BEFORE any module import — Better Auth creates its pg Pool
// at import time (auth.config.ts) and needs DATABASE_URL available.
import 'dotenv/config';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { AppModule } from './app.module';

// Safety net global: cualquier promise no atrapada (cronjobs, R2, pg_dump,
// etc.) se loguea pero NO mata el proceso. Sin esto, Node 22 trata
// unhandledRejection como fatal por default → restart loop, ticks de cron
// perdidos, y "el cronjob no corre cuando no estoy en la web".
const processLogger = new Logger('Process');
process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? `${reason.message}\n${reason.stack}` : String(reason);
  processLogger.error(`Unhandled Rejection: ${message}`);
});
process.on('uncaughtException', (err) => {
  processLogger.error(`Uncaught Exception: ${err.message}\n${err.stack}`);
});

async function bootstrap(): Promise<void> {
  // bodyParser: false → Better Auth catch-all needs the raw body stream.
  // JSON parsing is re-applied below for all non-auth routes.
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Rate-limit auth endpoints (login, sign-up, password reset).
  // The NestJS ThrottlerGuard doesn't apply here because the catch-all
  // auth controller bypasses the NestJS pipeline with @Res().
  const authRateMap = new Map<string, { count: number; resetAt: number }>();
  const AUTH_RATE_WINDOW_MS = 60_000;
  const AUTH_RATE_MAX = 10;
  app.use('/api/auth', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method !== 'POST') return next();
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const entry = authRateMap.get(ip);
    if (!entry || now > entry.resetAt) {
      authRateMap.set(ip, { count: 1, resetAt: now + AUTH_RATE_WINDOW_MS });
      return next();
    }
    if (entry.count >= AUTH_RATE_MAX) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    entry.count++;
    return next();
  });

  // Block public self-registration. User creation is only allowed through:
  // - Admin seed (server-side auth.api.signUpEmail — bypasses Express)
  // - Admin plugin (POST /api/auth/admin/create-user — different route)
  app.use('/api/auth/sign-up', (_req: express.Request, res: express.Response) => {
    res.status(403).json({ message: 'Public registration is disabled' });
  });

  // Re-apply body parsing, skipping Better Auth routes (it reads raw stream).
  const jsonParser = express.json();
  const urlencodedParser = express.urlencoded({ extended: true });
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl.startsWith('/api/auth')) return next();
    jsonParser(req, res, next);
  });
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl.startsWith('/api/auth')) return next();
    urlencodedParser(req, res, next);
  });

  const config = app.get(ConfigService);

  const port = config.get<number>('PORT', 3000);

  // CORS_ORIGIN is required by env.validation.ts — no wildcard fallback here.
  // Accept a comma-separated list so dev (localhost:5173) and prod
  // (app.vaultly.io) can coexist in a single deploy artifact.
  const corsOrigin = config.getOrThrow<string>('CORS_ORIGIN');
  const allowedOrigins = corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.enableShutdownHooks();

  // Global DTO validation. Without this, decorators like @IsEnum / @IsUUID
  // are no-ops at runtime — bad payloads reach the service layer or worse,
  // hit Postgres as NOT NULL violations instead of clear 400 responses.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (config.get<string>('NODE_ENV') === 'development') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Vaultly Control API')
      .setDescription('Database backup and restore management for Kubernetes environments')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);

  const logger = new Logger('VaultlyControl');
  logger.log(`Application running on port ${port}`);
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
