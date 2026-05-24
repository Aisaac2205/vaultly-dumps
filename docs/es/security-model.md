# Modelo de Seguridad

> 🇬🇧 English version: [../en/security-model.md](../en/security-model.md)

Este documento captura los **invariantes de seguridad** del sistema. No son sugerencias — son reglas que el código aplica activamente. Romperlos requiere modificar código y dejará rastro en review.

---

## 1. Invariantes de PROD

### 1.1 Las conexiones PROD son inmutables desde la API

**Dónde:** `apps/api/src/modules/connections/connections.service.ts`

```typescript
if (existing.environment === Environment.PROD) {
  throw new ForbiddenException(...);
}
```

Aplica a `update()` y `delete()`. La razón: una conexión PROD es la fuente de verdad. Modificarla desde la app abre la puerta a que un usuario con permisos pueda apuntar el job de backup hacia un host falso y exfiltrar dumps.

### 1.2 Los backups solo pueden originarse en PROD

**Dónde:** `apps/api/src/modules/backup/backup.service.ts`

```typescript
if (connection.environment !== Environment.PROD) {
  throw new BadRequestException(...);
}
```

Por diseño: este sistema existe para mover datos **desde** PROD **hacia** entornos de prueba. Backupear DEV/SQA no tiene sentido y se bloquea explícitamente.

### 1.3 Los restores nunca pueden tocar PROD

**Dónde:** `apps/api/src/modules/restore/restore.service.ts`

```typescript
if (targetEnvironment === Environment.PROD) {
  throw new ForbiddenException(...);
}
```

Esta es **la regla más crítica**. Restaurar sobre PROD destruiría datos en vivo.

> **Nota histórica:** Existió un `NoProdRestoreGuard` a nivel controller. Se eliminó porque inspeccionaba `body.targetEnvironment`, pero el DTO tiene `targetConnectionId` (UUID). El guard nunca encontraba el campo y siempre dejaba pasar — protección falsa. La protección real vive y siempre vivió en el service, donde se resuelve la conexión y se lee su environment de DB. Ver `docs/scheduler-architecture.md` para el patrón equivalente.

---

## 2. Autenticación

### Stack

- **IdP**: Keycloak (realm `coide-org`, cliente `clara-dumps` en `https://auth.coide.online`)
- **Flow**: PKCE en el frontend (vía `keycloak-js`)
- **Validación de tokens**: `jwks-rsa` con cache (10 min, max 5 keys, rate-limited a 10 req/min)
- **Algoritmo**: lo que diga el header `kid` del JWT, resuelto contra el JWKS endpoint del realm

### Claims requeridos en el access token

| Claim | Obligatorio | Uso |
|-------|-------------|-----|
| `sub` | sí | ID del usuario, va a `audit_logs.userId` y `backup_jobs.triggeredBy` |
| `preferred_username` | sí | Identificador legible, usado en logs |
| `realm_access.roles` | sí | Array de roles (no se usa para autorización todavía, pero se requiere) |
| `email` | **no** | Opcional — el realm de coide-org no lo emite. Si está, se usa en `audit_logs.userEmail`; si no, se loggea como `'anonymous'` |

### Guard

`JwtAuthGuard` (en `apps/api/src/common/guards/`) se aplica **explícitamente** en cada controller. No hay guard global. Si agregás un controller nuevo, **acordate de proteger sus endpoints**.

Excepción consciente: `/health` no requiere auth (lo consume el K8s probe).

---

## 3. Auditoría

### ¿Qué se audita?

Cualquier request HTTP con método `POST`, `PUT`, `PATCH` o `DELETE` que pase por el `AuditInterceptor` global.

**Se auditan tanto los éxitos como los errores** (`tap({ next, error })`). Un intento fallido de borrar PROD también queda registrado.

### Estructura de un registro

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

### Limitaciones conocidas

1. **`environment` defaultea a `dev`** cuando la request no incluye un campo `environment` ni en body ni en params. Esto contamina el dashboard con falsos DEV. Para arreglarlo de raíz hay que hacer `AuditLogEntity.environment` nullable (requiere migración).

2. **Los cronjobs no se auditan en `audit_logs`.** Corren in-process, no por HTTP, así que el interceptor no los ve. Su trazabilidad vive en `backup_jobs.triggeredBy = 'system-cronjob'`. Si necesitás auditoría unificada, hay que invocar manualmente el log desde `CronjobsService.executeCronjob`.

3. **Los logs son append-only a nivel DB.** Un trigger (`audit_logs_immutable`) lanza una excepción ante cualquier `UPDATE` o `DELETE` en la tabla `audit_logs`. Esto previene adulteración incluso por usuarios con acceso directo a la DB. Para non-repudiation criptográfico, los registros deberían además firmarse o exportarse a un sistema WORM.

---

## 4. Credenciales de conexión

Las contraseñas de las DBs registradas se **cifran en reposo** usando AES-256-GCM en la columna `connections.password`.

### Cómo funciona

- Un column transformer de TypeORM (`apps/api/src/common/utils/encryption.ts`) cifra al escribir y descifra al leer usando la variable de entorno `ENCRYPTION_KEY`.
- El formato almacenado es `iv:authTag:ciphertext` (todo en hex). Cada escritura usa un IV aleatorio, así que el mismo password produce un ciphertext diferente cada vez.
- El decorador `@Exclude()` de `class-transformer` asegura que el password descifrado **nunca sale por la API** en responses HTTP.
- Las queries de listado/detalle del repository usan un `select` explícito que excluye la columna password. Solo `findById` (usado internamente por backup/restore) la retorna.
- Valores legacy en plaintext (de antes del cifrado) se detectan en la función `decrypt` (no tienen el formato `iv:tag:ciphertext`) y se retornan tal cual, permitiendo migración transparente.

### Requisitos

- `ENCRYPTION_KEY` debe setearse como un string hex de 64 caracteres (clave de 256 bits). Generar con:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Si se pierde la clave, **todos los passwords almacenados quedan irrecuperables**. Respaldar la clave de forma segura.
- No hay rotación automática de credenciales todavía.

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

- **Producción**: si `CORS_ORIGIN` no está definido, **la app no arranca**. Sin defaults silenciosos.
- **Desarrollo/test**: default `*` para no fricción local.

Configurar en producción con el dominio exacto del frontend (ej: `https://vaultly.coide.online`). No usar wildcards.

---

## 6. Validación de input

`ValidationPipe` global con:

```typescript
{
  whitelist: true,            // ignora props no declaradas en el DTO
  forbidNonWhitelisted: true, // rechaza requests con props extra (400)
  transform: true,            // convierte a la clase del DTO + tipos primitivos
}
```

Combinado con `class-validator` en cada DTO (`@IsString`, `@IsUUID`, `@IsEnum`, etc.). Esto cubre la **mayoría** de los OWASP Top 10 input-related. Lo que NO cubre:

- **SQLi**: TypeORM con queries parametrizadas lo previene. El único raw SQL del proyecto está en `restore.service.ts` (`dryRun*`) y son queries fijas sin interpolación de input.
- **SSRF en `host`/`port` de conexiones**: no se valida que no apunten a `localhost`/`169.254.169.254`/etc. Si el sistema corre en cloud, considerar un allowlist de subnets.

---

## 7. Resumen del threat model

| Amenaza | Mitigación |
|---------|------------|
| Usuario con JWT válido borra una DB de PROD por error | Bloqueado: `update`/`delete` lanzan 403 si environment=PROD |
| Usuario maliciosamente restaura un dump viejo sobre PROD | Bloqueado: `restore` lanza 403 si target environment=PROD |
| Dump exfiltrado vía URL de R2 | Mitigado: bucket privado, acceso vía credenciales R2 (no público) |
| Token JWT robado vía XSS | Mitigado parcialmente: CORS strict en prod limita origen |
| DB de control comprometida → leak de credenciales de PROD | Mitigado: passwords cifrados con AES-256-GCM. Requiere `ENCRYPTION_KEY` para descifrar. Ver §4 |
| Audit log adulterado por DBA con acceso | Mitigado: trigger append-only previene UPDATE/DELETE en `audit_logs`. Ver §3 |
| Cronjob apunta a host atacante | Mitigado: cronjob requiere `connectionId` que solo puede crearse via `POST /connections` (auditado) |

Las amenazas no mitigadas restantes (SSRF en hosts de conexiones, falta de rotación de credenciales) son **decisiones conscientes** para el alcance actual del sistema (tool interno, equipo pequeño, cloud privado).
