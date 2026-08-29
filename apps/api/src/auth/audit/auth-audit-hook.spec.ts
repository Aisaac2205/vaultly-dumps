import { createAuthAuditHook } from './auth-audit-hook';
import type { AuthHookContext } from './auth-audit-hook';

const headers = (values: Record<string, string>): Headers =>
  new Headers(values);

const createRecorder = (): {
  exec: (sql: string, params: readonly unknown[]) => Promise<void>;
  rows: readonly unknown[][];
} => {
  const rows: readonly unknown[][] = [];
  return {
    exec: async (_sql, params) => {
      (rows as unknown[][]).push([...params]);
    },
    rows,
  };
};

describe('createAuthAuditHook', () => {
  it('records a rejected sign-in with the client address forwarded by nginx', async () => {
    const { exec, rows } = createRecorder();
    const hook = createAuthAuditHook(exec);

    const ctx: AuthHookContext = {
      path: '/sign-in/email',
      body: { email: 'someone@example.com', password: 'hunter2' },
      headers: headers({ 'x-real-ip': '203.0.113.7' }),
      context: { returned: new Error('Invalid credentials') },
    };

    await hook(ctx);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain('auth.sign-in.email');
    expect(rows[0]).toContain('failure');
    expect(rows[0]).toContain('203.0.113.7');
  });

  it('never writes the submitted password into the trail', async () => {
    const { exec, rows } = createRecorder();
    const hook = createAuthAuditHook(exec);

    await hook({
      path: '/sign-in/email',
      body: { email: 'someone@example.com', password: 'hunter2' },
      headers: headers({ 'x-real-ip': '203.0.113.7' }),
      context: { returned: new Error('Invalid credentials') },
    });

    expect(JSON.stringify(rows[0])).not.toContain('hunter2');
  });

  it('writes nothing for endpoints outside the audited set', async () => {
    const { exec, rows } = createRecorder();
    const hook = createAuthAuditHook(exec);

    await hook({
      path: '/get-session',
      headers: headers({ 'x-real-ip': '203.0.113.7' }),
      context: { returned: { session: {} } },
    });

    expect(rows).toHaveLength(0);
  });
});
