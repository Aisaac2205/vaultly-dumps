import { Logger } from '@nestjs/common';
import type { AuthAuditEvent } from './auth-audit-event';

/**
 * Narrow port over whatever executes the insert. Better Auth is configured
 * at module scope, outside the Nest DI container, so the caller passes the
 * already-open pg pool from auth.config.ts rather than a Nest provider.
 */
export type AuditInsertExecutor = (
  sql: string,
  params: readonly unknown[],
) => Promise<void>;

const INSERT_AUDIT_LOG = `INSERT INTO "audit_logs" (
  "action", "userId", "username", "resourceType", "resourceId",
  "metadata", "environment", "ipAddress", "userAgent", "outcome", "severity"
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

const logger = new Logger('AuthAudit');

export async function writeAuthAuditEvent(
  exec: AuditInsertExecutor,
  event: AuthAuditEvent,
): Promise<void> {
  try {
    await exec(INSERT_AUDIT_LOG, [
      event.action,
      event.userId,
      event.username,
      event.resourceType,
      event.resourceId,
      JSON.stringify(event.metadata),
      // An authentication event belongs to no ERP environment; the column
      // is nullable precisely so this stays out of the environment filter.
      null,
      event.ipAddress,
      event.userAgent,
      event.outcome,
      event.severity,
    ]);
  } catch (error) {
    // Better Auth re-throws anything that is not an APIError out of
    // runAfterHooks, which would replace the auth response with a crash.
    // A missing audit row must never cost the user their sign-in.
    logger.error(
      `Failed to record ${event.action}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
