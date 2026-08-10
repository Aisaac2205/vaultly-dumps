import { readFileSync } from 'fs';
import { join } from 'path';
import { ExecutionContext, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, Roles } from '../../auth/roles.guard';
import { AuthUser } from '../../auth/decorators/current-user.decorator';

// AuditController itself is not imported here: it transitively pulls in
// auth.guard.ts -> better-auth/node, which is ESM-only and this repo's
// Jest config doesn't transform node_modules. Instead this exercises the
// real RolesGuard logic (the actual security mechanism) against a
// same-shape stand-in, plus a static check that the real controller file
// still carries the guard + decorator — catching the regression this was
// filed for (AuditController had BetterAuthGuard but no RolesGuard, so
// any authenticated non-admin could read the audit trail).

@UseGuards(RolesGuard)
@Roles('admin')
class AdminOnlyStandIn {
  handler(): void {}
}

function buildContext(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => AdminOnlyStandIn.prototype.handler,
    getClass: () => AdminOnlyStandIn,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard, applied the way AuditController now applies it', () => {
  const guard = new RolesGuard(new Reflector());

  it('rejects an authenticated non-admin user', () => {
    const context = buildContext({
      id: '1',
      email: 'user@example.com',
      name: 'User',
      role: 'user',
    });

    expect(() => guard.canActivate(context)).toThrow('Insufficient permissions');
  });

  it('rejects a request with no user at all', () => {
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(
      'Insufficient permissions',
    );
  });

  it('allows an admin user through', () => {
    const context = buildContext({
      id: '2',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});

describe('AuditController source', () => {
  const source = readFileSync(
    join(__dirname, 'audit.controller.ts'),
    'utf-8',
  );

  it('still guards with RolesGuard and requires the admin role', () => {
    expect(source).toMatch(/@UseGuards\(BetterAuthGuard,\s*RolesGuard\)/);
    expect(source).toMatch(/@Roles\(['"]admin['"]\)/);
  });
});
