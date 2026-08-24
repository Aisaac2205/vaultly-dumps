import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { Repository } from 'typeorm';
import { AuthUser } from '../../auth/decorators/current-user.decorator';
import { getAuditContext } from '../audit/audit-context';
import { JsonRecord, redactSensitive } from '../sanitization/redact-sensitive';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { Environment } from '../../database/enums/environment.enum';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const AUDITED_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!AUDITED_METHODS.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => { void this.saveAuditLog(request, context); },
        error: () => { void this.saveAuditLog(request, context); },
      }),
    );
  }

  private async saveAuditLog(
    request: AuthenticatedRequest,
    context: ExecutionContext,
  ): Promise<void> {
    try {
      const user = request.user;
      const params = request.params as Record<string, string>;
      const body = (request.body ?? {}) as Record<string, string>;
      const ctx = getAuditContext(request);

      // Precedence: audit context (set by controller after service
      // resolves the entity) > body > params > DEV fallback.
      const env = (ctx?.environment ??
        body['environment'] ??
        params['environment'] ??
        Environment.DEV) as Environment;

      const resourceId =
        ctx?.resourceId ?? params['id'] ?? 'unknown';

      const baseMetadata: JsonRecord = {
        body: redactSensitive(body as JsonRecord),
        query: redactSensitive(request.query as JsonRecord),
      };

      await this.auditRepo.save({
        action: `${request.method} ${request.path}`,
        userId: user?.id ?? 'anonymous',
        username: user?.email ?? 'anonymous',
        resourceType: context.getClass().name,
        resourceId,
        metadata: ctx?.metadata
          ? { ...baseMetadata, ...redactSensitive(ctx.metadata as JsonRecord) }
          : baseMetadata,
        environment: env,
      });
    } catch (error) {
      this.logger.error(
        `Failed to save audit log for ${request.method} ${request.path}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
