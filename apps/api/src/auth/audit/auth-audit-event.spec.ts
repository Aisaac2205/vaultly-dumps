import { toAuthAuditEvent } from './auth-audit-event';

describe('toAuthAuditEvent', () => {
  it('records a failed email sign-in with the attempted address and no user id', () => {
    const event = toAuthAuditEvent({
      path: '/sign-in/email',
      failed: true,
      body: { email: 'someone@example.com', password: 'hunter2' },
      ipAddress: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
      user: null,
    });

    expect(event).toEqual({
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
    });
  });

  it('ignores high-frequency session reads so they never reach the audit trail', () => {
    const event = toAuthAuditEvent({
      path: '/get-session',
      failed: false,
      body: {},
      ipAddress: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
      user: { id: 'user-1', email: 'someone@example.com' },
    });

    expect(event).toBeNull();
  });

  it('rates a successful password change above a routine sign-in', () => {
    const changed = toAuthAuditEvent({
      path: '/change-password',
      failed: false,
      body: {},
      ipAddress: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
      user: { id: 'user-1', email: 'someone@example.com' },
    });

    expect(changed?.severity).toBe('high');
  });

  it('attributes a successful sign-in to the authenticated user', () => {
    const event = toAuthAuditEvent({
      path: '/sign-in/email',
      failed: false,
      body: { email: 'someone@example.com' },
      ipAddress: '203.0.113.7',
      userAgent: 'Mozilla/5.0',
      user: { id: 'user-1', email: 'someone@example.com' },
    });

    expect(event).toMatchObject({
      outcome: 'success',
      severity: 'low',
      userId: 'user-1',
      username: 'someone@example.com',
    });
  });
});
