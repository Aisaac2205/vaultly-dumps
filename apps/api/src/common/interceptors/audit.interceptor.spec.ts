import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { firstValueFrom, of } from 'rxjs';
import { Repository } from 'typeorm';
import { AuditInterceptor } from './audit.interceptor';
import { setAuditContext } from '../audit/audit-context';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { Environment } from '../../database/enums/environment.enum';

interface SavedAuditLog {
  action: string;
  metadata: Record<string, unknown>;
  environment: Environment;
}

function buildRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'POST',
    path: '/connections',
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as Request;
}

function buildContext(request: Request): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getClass: () => ({ name: 'ConnectionsController' }),
  } as ExecutionContext;
}

describe('AuditInterceptor', () => {
  let saved: SavedAuditLog[];
  let interceptor: AuditInterceptor;

  const nextHandler: CallHandler = { handle: () => of({ id: 'created' }) };

  beforeEach(() => {
    saved = [];
    const repo = {
      save: jest.fn((entity: SavedAuditLog) => {
        saved.push(entity);
        return Promise.resolve(entity);
      }),
    } as unknown as Repository<AuditLogEntity>;
    interceptor = new AuditInterceptor(repo);
  });

  it('redacts sensitive keys inside ctx.metadata before persisting', async () => {
    const request = buildRequest();
    setAuditContext(request, {
      environment: Environment.DEV,
      resourceId: 'conn-1',
      metadata: { targetConnectionId: 'conn-1', password: 'hunter2' },
    });

    await firstValueFrom(interceptor.intercept(buildContext(request), nextHandler));

    expect(saved).toHaveLength(1);
    expect(saved[0].metadata).toMatchObject({
      targetConnectionId: 'conn-1',
      password: '[REDACTED]',
    });
  });

  it('redacts sensitive keys nested deep inside ctx.metadata', async () => {
    const request = buildRequest();
    setAuditContext(request, {
      metadata: { connection: { host: 'db.internal', credential: { apiKey: 'live-key' } } },
    });

    await firstValueFrom(interceptor.intercept(buildContext(request), nextHandler));

    expect(saved[0].metadata).toMatchObject({
      connection: { host: 'db.internal', credential: '[REDACTED]' },
    });
  });

  it('still redacts the request body as it did before', async () => {
    const request = buildRequest({ body: { name: 'erp-prod', password: 'hunter2' } });

    await firstValueFrom(interceptor.intercept(buildContext(request), nextHandler));

    expect(saved[0].metadata['body']).toEqual({
      name: 'erp-prod',
      password: '[REDACTED]',
    });
  });

  it('does not audit read-only methods', async () => {
    const request = buildRequest({ method: 'GET' });

    await firstValueFrom(interceptor.intercept(buildContext(request), nextHandler));

    expect(saved).toHaveLength(0);
  });
});
