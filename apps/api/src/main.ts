import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  const app = await NestFactory.create(AppModule);
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

  if (config.get<string>('NODE_ENV') !== 'production') {
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
