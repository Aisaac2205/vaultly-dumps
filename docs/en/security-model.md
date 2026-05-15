# Security Model

> 🇪🇸 Versión en español: [../es/security-model.md](../es/security-model.md)

This document captures the **security invariants** of the system. They are not suggestions — they are rules the code actively enforces. Breaking them requires code changes and will show up in review.

---

## 1. PROD invariants

### 1.1 PROD connections are immutable from the API

**Where:** `apps/api/src/modules/connections/connections.service.ts`

```typescript
if (existing.environment === Environment.PROD) {
  throw new ForbiddenException(...);
}
```

Applies to `update()` and `delete()`. The reason: a PROD connection is the source of truth. Modifying it from the app opens the door for a user with API permissions to point the backup job at a rogue host and exfiltrate dumps.

### 1.2 Backups can only originate from PROD

**Where:** `apps/api/src/modules/backup/backup.service.ts`

```typescript
if (connection.environment !== Environment.PROD) {
  throw new BadRequestException(...);
}
```

By design: this system exists to move data **from** PROD **into** testing environments. Backing up DEV/SQA makes no sense and is explicitly blocked.

### 1.3 Restores can never touch PROD

**Where:** `apps/api/src/modules/restore/restore.service.ts`

```typescript
if (targetEnvironment === Environment.PROD) {
  throw new ForbiddenException(...);
}
```

This is **the most critical rule**. Restoring over PROD would destroy live data.

> **Historical note:** A `NoProdRestoreGuard` used to exist at the controller level. It was removed because it inspected `body.targetEnvironment`, but the DTO has `targetConnectionId` (a UUID). The guard never found the field and always let requests through — fake protection. The real protection lives, and always lived, in the service, where the connection is resolved and its environment is read from DB. See `docs/scheduler-architecture.md` for the equivalent pattern.

---

## 2. Authentication

### Stack

- **IdP**: Keycloak (realm `coide-org`, client `clara-dumps` at `https://auth.coide.online`)
- **Flow**: PKCE in the frontend (via `keycloak-js`)
- **Token validation**: `jwks-rsa` with cache (10 min, max 5 keys, rate-limited to 10 req/min)
- **Algorithm**: whatever the JWT's `kid` header says, resolved against the realm's JWKS endpoint

### Required claims in the access token

| Claim | Required | Use |
|-------|----------|-----|
| `sub` | yes | User ID, goes into `audit_logs.userId` and `backup_jobs.triggeredBy` |
| `preferred_username` | yes | Human-readable identifier, used in logs |
| `realm_access.roles` | yes | Role array (not used for authorization yet, but required) |
| `email` | **no** | Optional — the coide-org realm doesn't emit it. If present, used in `audit_logs.userEmail`; otherwise logged as `'anonymous'` |

### Guard

`JwtAuthGuard` (in `apps/api/src/common/guards/`) is applied **explicitly** on every controller. There is no global guard. If you add a new controller, **remember to protect its endpoints**.

Conscious exception: `/health` does not require auth (it's hit by the K8s probe).

---

## 3. Audit

### What gets audited?

Any HTTP request with method `POST`, `PUT`, `PATCH` or `DELETE` that passes through the global `AuditInterceptor`.

**Both successes and errors are audited** (`tap({ next, error })`). A failed attempt to delete PROD is also recorded.

### Record structure

```typescript
{
  id: uuid,
  action: "DELETE /connections/abc-123",
  userId: "user-sub-from-jwt",
  userEmail: "user@example.com" | "anonymous",
  resourceType: "ConnectionsController",
  resourceId: "abc-123",
  metadata: { ...body... },
  environment: "prod" | "dev" | "sqa",
  createdAt: timestamp
}
```

### Known limitations

1. **`environment` defaults to `dev`** when the request includes neither an `environment` field in the body nor in params. This contaminates the dashboard with false DEVs. Fixing it properly means making `AuditLogEntity.environment` nullable (requires a migration).

2. **Cronjobs are not audited in `audit_logs`.** They run in-process, not over HTTP, so the interceptor doesn't see them. Their traceability lives in `backup_jobs.triggeredBy = 'system-cronjob'`. If you need unified auditing, you must invoke the log manually from `CronjobsService.executeCronjob`.

3. **Logs are not cryptographically immutable** — they are a SQL table editable by anyone with access to the control DB. If you need non-repudiation, you have to sign records or ship them to a WORM system.

---

## 4. Connection credentials

Passwords of registered DBs are stored **in plaintext** in the `connections.password` column.

### What's fine

- The column uses `@Exclude()` from `class-transformer`. Combined with the global `ClassSerializerInterceptor`, **the password never leaves the API** in a response.
- Access to the control DB is restricted to the app (not exposed to the public network in prod).

### What's NOT fine (explicit debt)

- If the control DB is compromised, **every password of every registered host is exposed in clear text**.
- There is no automatic credential rotation.

### When to migrate to encryption

Migrate to symmetric encryption (AES-256-GCM with a key derived from an environment secret) when:

- Connections are added to hosts managed by third parties
- Compliance requirements come into play (PCI, SOC 2, etc.)
- The team grows and keeping access to the control DB restricted is no longer viable

---

## 5. CORS

```typescript
// apps/api/src/config/env.validation.ts
CORS_ORIGIN: Joi.string().when('NODE_ENV', {
  is: 'production',
  then: Joi.string().required(),
  otherwise: Joi.string().default('*'),
}),
```

- **Production**: if `CORS_ORIGIN` is not defined, **the app does not start**. No silent defaults.
- **Development/test**: default `*` for no local friction.

In production configure it with the exact frontend domain (e.g. `https://vaultly.coide.online`). No wildcards.

---

## 6. Input validation

Global `ValidationPipe` with:

```typescript
{
  whitelist: true,            // ignores props not declared in the DTO
  forbidNonWhitelisted: true, // rejects requests with extra props (400)
  transform: true,            // converts to the DTO class + primitive types
}
```

Combined with `class-validator` on each DTO (`@IsString`, `@IsUUID`, `@IsEnum`, etc.). This covers **most** of the input-related OWASP Top 10. What it does NOT cover:

- **SQLi**: TypeORM with parameterized queries prevents it. The only raw SQL in the project is in `restore.service.ts` (`dryRun*`) and they are fixed queries without input interpolation.
- **SSRF on `host`/`port` of connections**: there is no validation against `localhost`/`169.254.169.254`/etc. If the system runs in cloud, consider a subnet allowlist.

---

## 7. Threat model summary

| Threat | Mitigation |
|--------|------------|
| User with a valid JWT deletes a PROD DB by mistake | Blocked: `update`/`delete` throw 403 if environment=PROD |
| User maliciously restores an old dump on top of PROD | Blocked: `restore` throws 403 if target environment=PROD |
| Dump exfiltrated via R2 URL | Mitigated: private bucket, access via R2 credentials (not public) |
| JWT token stolen via XSS | Partially mitigated: strict CORS in prod limits the origin |
| Control DB compromised → leak of PROD credentials | **Not mitigated**: plaintext passwords. See §4 |
| Audit log tampered with by a DBA with access | **Not mitigated**: editable SQL table. See §3 limitation 3 |
| Cronjob points at attacker host | Mitigated: cronjob requires a `connectionId` that can only be created via `POST /connections` (audited) |

The "not mitigated" ones are **conscious decisions** for the current scope of the system (internal tool, small team, private cloud). When any of the §4 triggers fires, they must be revisited.
