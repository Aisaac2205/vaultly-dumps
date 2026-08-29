import { JsonRecord } from '../../common/sanitization/redact-sensitive';
import { toAuthAuditEvent } from './auth-audit-event';
import {
  writeAuthAuditEvent,
  type AuditInsertExecutor,
} from './auth-audit-writer';

interface AuthHookSession {
  user?: { id?: string; email?: string } | null;
}

/**
 * The subset of Better Auth's middleware context this hook actually reads.
 * Declared structurally so the hook stays testable without constructing a
 * real auth instance, and so a Better Auth type change surfaces here rather
 * than deep inside the audit logic.
 */
export interface AuthHookContext {
  path: string;
  body?: JsonRecord;
  headers?: Headers;
  context: {
    returned?: unknown;
    newSession?: AuthHookSession | null;
  };
}

// nginx overwrites both X-Real-IP and X-Forwarded-For with a single
// validated client address (see apps/web/templates/default.conf.template),
// and the API trusts exactly one hop. Reading the single-valued header
// avoids the spoofable multi-hop X-Forwarded-For chain entirely.
const CLIENT_IP_HEADER = 'x-real-ip';

export function createAuthAuditHook(
  exec: AuditInsertExecutor,
): (ctx: AuthHookContext) => Promise<void> {
  return async (ctx: AuthHookContext): Promise<void> => {
    const user = ctx.context.newSession?.user;

    const event = toAuthAuditEvent({
      path: ctx.path,
      // Better Auth surfaces a rejected endpoint as an APIError placed on
      // ctx.context.returned rather than by throwing past the after hook.
      failed: ctx.context.returned instanceof Error,
      body: ctx.body ?? {},
      ipAddress: ctx.headers?.get(CLIENT_IP_HEADER) ?? null,
      userAgent: ctx.headers?.get('user-agent') ?? null,
      user:
        user?.id && user.email ? { id: user.id, email: user.email } : null,
    });

    if (!event) {
      return;
    }

    await writeAuthAuditEvent(exec, event);
  };
}
