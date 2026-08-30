import { Body, Controller, Module, Post } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getRepositoryToken } from '@nestjs/typeorm';
import express from 'express';
import { AuditInterceptor } from './audit.interceptor';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';

interface SavedLog {
  action: string;
  metadata: Record<string, Record<string, string>>;
}

const saved: SavedLog[] = [];

@Controller('probe')
class ProbeController {
  @Post()
  create(@Body() body: Record<string, string>): { received: string } {
    return { received: Object.keys(body).join(',') };
  }
}

@Module({
  controllers: [ProbeController],
  providers: [
    {
      provide: getRepositoryToken(AuditLogEntity),
      useValue: {
        save: (log: SavedLog): Promise<SavedLog> => {
          saved.push(log);
          return Promise.resolve(log);
        },
      },
    },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
class ProbeModule {}

describe('AuditInterceptor over a real HTTP request', () => {
  let app: NestExpressApplication;
  let baseUrl: string;

  beforeAll(async () => {
    // Mirrors main.ts: Better Auth needs the raw stream, so body parsing is
    // disabled globally and re-applied for every non-auth route.
    app = await NestFactory.create<NestExpressApplication>(ProbeModule, {
      bodyParser: false,
      logger: false,
    });

    const jsonParser = express.json();
    app.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        if (req.originalUrl.startsWith('/api/auth')) return next();
        jsonParser(req, res, next);
      },
    );

    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    saved.length = 0;
  });

  it('captures the submitted body, which a hand-built request object cannot prove', async () => {
    const response = await fetch(`${baseUrl}/probe?environment=prod`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'erp-prod', password: 'hunter2' }),
    });

    expect(response.status).toBe(201);
    expect(saved).toHaveLength(1);
    expect(saved[0].metadata.body).toEqual({
      name: 'erp-prod',
      password: '[REDACTED]',
    });
  });

  it('captures the query string alongside the body', async () => {
    await fetch(`${baseUrl}/probe?environment=prod&token=leaky`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'erp-prod' }),
    });

    expect(saved[0].metadata.query).toEqual({
      environment: 'prod',
      token: '[REDACTED]',
    });
  });
});
