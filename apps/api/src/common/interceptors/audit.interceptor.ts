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
import { KeycloakUser } from '../decorators/current-user.decorator';
import { AuditLogEntity } from '../../database/entities/audit-log.entity';
import { Environment } from '../../database/enums/environment.enum';

interface AuthenticatedRequest extends Request {
  user?: KeycloakUser;
}

const AUDITED_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

// Keys whose values must NEVER reach the audit_logs table. Matched
// case-insensitively against object keys at any depth. Sin esto, el
// body de POST /connections (password de la conexión), test-raw,
// y cualquier PATCH con campos sensibles termina en jsonb y se
// renderiza tal cual en la UI de /audit.
const SENSITIVE_KEY_PATTERNS: readonly RegExp[] = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /access[_-]?key/i,
  /authorization/i,
  /credential/i,
  /private[_-]?key/i,
];

const REDACTED = '[REDACTED]';

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function redactSensitive(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map(redactSensitive);
  if (typeof input !== 'object') return input;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(value);
  }
  return out;
}

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

      // environment is required by the schema (NOT NULL enum).
      // For actions that don't target a specific environment (e.g. managing
      // connections or cronjobs), we fall back to DEV as a neutral marker.
      // To remove this fallback, make AuditLogEntity.environment nullable.
      const env = (body['environment'] ??
        params['environment'] ??
        Environment.DEV) as Environment;

      await this.auditRepo.save({
        action: `${request.method} ${request.path}`,
        userId: user?.sub ?? 'anonymous',
        username: user?.preferred_username ?? 'anonymous',
        resourceType: context.getClass().name,
        resourceId: params['id'] ?? 'unknown',
        metadata: {
          body: redactSensitive(body),
          query: redactSensitive(request.query),
        } as Record<string, unknown>,
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
