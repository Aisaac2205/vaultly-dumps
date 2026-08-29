import { JsonRecord } from '../../common/sanitization/redact-sensitive';

export type AuditOutcome = 'success' | 'failure';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuthAuditActor {
  id: string;
  email: string;
}

export interface AuthAuditInput {
  path: string;
  failed: boolean;
  body: JsonRecord;
  ipAddress: string | null;
  userAgent: string | null;
  user: AuthAuditActor | null;
}

export interface AuthAuditEvent {
  action: string;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  userId: string;
  username: string;
  ipAddress: string | null;
  userAgent: string | null;
  resourceType: string;
  resourceId: string;
  metadata: JsonRecord;
}

const ANONYMOUS = 'anonymous';

// Allowlist, not denylist: hooks.after fires on every auth endpoint,
// including /get-session, which the SPA polls. An unlisted path is not
// audited, so a new endpoint can never silently flood the append-only
// table before someone decides it belongs in the trail.
const AUDITED_PATHS: ReadonlySet<string> = new Set([
  '/sign-in/email',
  '/sign-out',
  '/change-password',
]);

// Baseline weight of the event when it succeeds. Taking over an account
// runs through a password change, so it outranks a routine sign-in even
// when it works exactly as intended.
const BASE_SEVERITY: Readonly<Record<string, AuditSeverity>> = {
  '/sign-in/email': 'low',
  '/sign-out': 'low',
  '/change-password': 'high',
};

export function toAuthAuditEvent(input: AuthAuditInput): AuthAuditEvent | null {
  if (!AUDITED_PATHS.has(input.path)) {
    return null;
  }

  const resourceId = input.path.replace(/^\//, '');
  const attempted =
    typeof input.body.email === 'string' ? input.body.email : ANONYMOUS;

  return {
    action: `auth.${resourceId.replace(/\//g, '.')}`,
    outcome: input.failed ? 'failure' : 'success',
    severity: input.failed ? 'medium' : BASE_SEVERITY[input.path],
    userId: input.user?.id ?? ANONYMOUS,
    username: input.user?.email ?? attempted,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    resourceType: 'Auth',
    resourceId,
    metadata: {},
  };
}
