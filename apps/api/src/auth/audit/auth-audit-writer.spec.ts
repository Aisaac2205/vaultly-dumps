import { writeAuthAuditEvent } from './auth-audit-writer';
import type { AuthAuditEvent } from './auth-audit-event';

const event: AuthAuditEvent = {
  action: 'auth.sign-in.email',
  outcome: 'failure',
  severity: 'medium',
  userId: 'anonymous',
  username: 'someone@example.com',
  ipAddress: '203.0.113.7',
  userAgent: 'Mozilla/5.0',
  resourceType: 'Auth',
  resourceId: 'sign-in/email',
  metadata: {},
};

describe('writeAuthAuditEvent', () => {
  it('leaves environment null so auth events stay out of the ERP environment filter', async () => {
    const calls: { sql: string; params: readonly unknown[] }[] = [];

    await writeAuthAuditEvent(
      async (sql, params) => {
        calls.push({ sql, params });
      },
      event,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain('INSERT INTO "audit_logs"');
    expect(calls[0].params).toContain('auth.sign-in.email');
    expect(calls[0].params).toContain('someone@example.com');
    expect(calls[0].params).toContain('203.0.113.7');
    expect(calls[0].params).toContain(null);
  });

  it('swallows a write failure instead of breaking the authentication response', async () => {
    const failing = async (): Promise<void> => {
      throw new Error('audit_logs is unreachable');
    };

    await expect(writeAuthAuditEvent(failing, event)).resolves.toBeUndefined();
  });
});
