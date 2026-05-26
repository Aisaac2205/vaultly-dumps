import { Request } from 'express';
import { Environment } from '../../database/enums/environment.enum';

/**
 * Symbol-based key so the audit context is invisible to
 * JSON.stringify, Object.keys, and spread operators — it
 * never leaks into response bodies or logs.
 */
const AUDIT_CTX = Symbol.for('app.auditContext');

export interface AuditContext {
  environment?: Environment;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Attach audit context to the current request.
 * Controllers call this AFTER the service resolves the entity
 * so the interceptor picks up the real environment / resource id.
 *
 * Merges with any previously set context (last write wins per key).
 */
export function setAuditContext(req: Request, ctx: AuditContext): void {
  const record = req as unknown as Record<symbol, unknown>;
  const existing = record[AUDIT_CTX] as AuditContext | undefined;
  record[AUDIT_CTX] = { ...existing, ...ctx };
}

export function getAuditContext(req: Request): AuditContext | undefined {
  return (req as unknown as Record<symbol, unknown>)[AUDIT_CTX] as
    | AuditContext
    | undefined;
}
