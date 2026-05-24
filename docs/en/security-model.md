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

3. **Logs are append-only at the DB level.** A trigger (`audit_logs_immutable`) raises an exception on any `UPDATE` or `DELETE` attempt on the `audit_logs` table. This prevents tampering even by users with direct DB access. For cryptographic non-repudiation, records should additionally be signed or shipped to a WORM system.

---

## 4. Connection credentials

Passwords of registered DBs are **encrypted at rest** using AES-256-GCM in the `connections.password` column.

### How it works

- A TypeORM column transformer (`apps/api/src/common/utils/encryption.ts`) encrypts on write and decrypts on read using the `ENCRYPTION_KEY` environment variable.
- The stored value format is `iv:authTag:ciphertext` (all hex-encoded). Each write uses a random IV, so the same password produces a different ciphertext every time.
- The `@Exclude()` decorator from `class-transformer` ensures the decrypted password **never leaves the API** in HTTP responses.
- Repository list/detail queries use an explicit `select` that excludes the password column entirely. Only `findById` (used internally by backup/restore) returns it.
- Legacy plaintext values (from before encryption was added) are detected by the `decrypt` function (they lack the `iv:tag:ciphertext` format) and returned as-is, allowing a seamless migration.

### Requirements

- `ENCRYPTION_KEY` must be set as a 64-character hex string (256-bit key). Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- If the key is lost, **all stored passwords become unrecoverable**. Back up the key securely.
- There is no automatic credential rotation yet.

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
| Control DB compromised → leak of PROD credentials | Mitigated: passwords encrypted with AES-256-GCM. Requires `ENCRYPTION_KEY` to decrypt. See §4 |
| Audit log tampered with by a DBA with access | Mitigated: append-only trigger prevents UPDATE/DELETE on `audit_logs`. See §3 |
| Cronjob points at attacker host | Mitigated: cronjob requires a `connectionId` that can only be created via `POST /connections` (audited) |

Remaining unmitigated threats (SSRF on connection hosts, lack of credential rotation) are **conscious decisions** for the current scope of the system (internal tool, small team, private cloud).
