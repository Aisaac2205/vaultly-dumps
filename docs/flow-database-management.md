# Flujo de Gestión de Bases de Datos

## ¿Qué es una "conexión"?

Una conexión (`ConnectionEntity`) representa una base de datos registrada en el sistema. Es la unidad sobre la que operan **backup**, **restore** y **cronjobs**.

No es la base de datos en sí — es **el puntero con credenciales** para acceder a ella.

---

## Campos requeridos al registrar

| Campo | Tipo | Obligatorio | Notas |
|-------|------|-------------|-------|
| `name` | string (max 100) | sí | Identificador legible para humanos |
| `environment` | `prod` \| `dev` \| `sqa` | sí | Define las reglas de seguridad aplicables |
| `dbType` | `postgres` \| `mysql` | no (default `postgres`) | Determina el motor y las herramientas que se usan |
| `host` | string | sí | Hostname o IP |
| `port` | 1–65535 | sí | Puerto del motor |
| `database` | string | sí | Nombre de la DB dentro del motor |
| `username` | string | sí | Usuario con permisos según el rol |
| `password` | string | sí | Se almacena plaintext, se excluye de las responses (`@Exclude()`) |

### Permisos mínimos del usuario por engine

- **PostgreSQL**: usuario con permiso de `CONNECT`, `pg_dump` requiere `SELECT` sobre todas las tablas a backupear
- **MySQL**: usuario con `SELECT`, `LOCK TABLES`, `SHOW VIEW`, `EVENT`, `TRIGGER`

---

## Endpoints

```
GET    /connections             Lista todas las conexiones activas
GET    /connections/:id         Obtiene una conexión específica
POST   /connections             Crea una conexión (cualquier environment)
PATCH  /connections/:id         Actualiza una conexión (BLOQUEADO si es PROD)
DELETE /connections/:id         Elimina una conexión (BLOQUEADO si es PROD)
POST   /connections/test        Testea una conexión por ID en el body
POST   /connections/:id/test    Testea una conexión por ID en la URL
POST   /connections/test-raw    Testea credenciales sin conexión guardada
```

```
GET    /backups/history                Historial de jobs enriquecido con nombre de conexión
POST   /backups                        Crea un backup (connectionId en el body)
POST   /backups/trigger/:connectionId  Disparador manual por connectionId (sin body)
PUT    /backups/settings/:connectionId Configura o actualiza el cronjob de esa conexión
GET    /backups/r2                     Lista objetos crudos en R2
GET    /backups/:id                    Obtiene un backup job por ID
```

Todos los endpoints requieren JWT válido (Keycloak).

---

## Reglas de PROD (invariantes de seguridad)

Una conexión con `environment === 'prod'` es **inmutable** desde la API:

| Acción | PROD | DEV / SQA |
|--------|------|-----------|
| Crear (`POST`) | ✅ | ✅ |
| Leer (`GET`) | ✅ | ✅ |
| Testear conexión | ✅ | ✅ |
| Editar (`PATCH`) | ❌ `403 Forbidden` | ✅ |
| Eliminar (`DELETE`) | ❌ `403 Forbidden` | ✅ |
| Hacer backup desde ella | ✅ | ❌ `400 BadRequest` |
| Restaurar hacia ella | ❌ `403 Forbidden` | ✅ |

**Por qué:** PROD es la fuente de verdad. Las modificaciones a una conexión PROD se hacen por **infraestructura/DBA** directamente, no por la aplicación. Esto evita que un usuario con permisos de la API pueda apuntar el job de backup a un host falso.

### ¿Y si necesito desactivar una conexión PROD legítimamente?

No hay endpoint. Por diseño. Las opciones legítimas son:

1. **Recrear el setup**: registrar la nueva conexión PROD correcta y dejar la vieja existente — los backups apuntan al nuevo `connectionId`.
2. **Mantenimiento directo en DB**: `UPDATE connections SET is_active = false WHERE id = '...'` ejecutado por un DBA con acceso físico a la DB de control. Este path queda fuera del audit log de la app — es intencional, es mantenimiento de infraestructura.

---

## Test de conexión

Hay dos modalidades:

### Por ID (conexión ya guardada)

```http
POST /connections/:id/test
POST /connections/test    { "connectionId": "..." }
```

### Raw (sin guardar — útil al llenar el formulario)

```http
POST /connections/test-raw
{
  "host": "...", "port": 5432, "database": "...",
  "username": "...", "password": "...", "dbType": "postgres"
}
```

Ambas devuelven:

```json
{ "success": true, "latencyMs": 47 }
```

```json
{ "success": false, "latencyMs": 5023, "error": "password authentication failed for user 'foo'" }
```

El test usa el cliente nativo del engine (`pg.Client` para Postgres, `mysql2/promise` para MySQL), no las herramientas CLI. Timeout fijo de **5 segundos**.

---

## Lifecycle

```
                  ┌──────────────────────┐
                  │  POST /connections   │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  ConnectionEntity    │
                  │  isActive: true      │
                  └──────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     environment=prod   env=dev/sqa   POST /:id/test
              │              │              │
              ▼              ▼              ▼
     ┌─────────────┐  ┌─────────────┐  ┌──────────┐
     │ Solo backup │  │ Backup ❌    │  │ Verifica │
     │ Solo lectura│  │ Restore ✅   │  │ creds    │
     │ + test      │  │ Edit ✅      │  └──────────┘
     │             │  │ Delete ✅    │
     └─────────────┘  └─────────────┘
              │              │
              ▼              ▼
     POST /backups    POST /restores
     (genera dump)    (consume dump)
              │              ▲
              ▼              │
        Cloudflare R2 ───────┘
```

---

## Historial de backups

`GET /backups/history` devuelve los jobs enriquecidos con el nombre de la conexión:

```json
[
  {
    "id": "...",
    "connectionId": "...",
    "connectionName": "producción-postgres",
    "environment": "prod",
    "status": "completed",
    "fileKey": "backups/.../2026-05-07T02-00-00.dump",
    "fileSizeMb": 142.7,
    "startedAt": "2026-05-07T02:00:00.000Z",
    "completedAt": "2026-05-07T02:01:23.000Z",
    "errorMessage": null,
    "createdAt": "2026-05-07T02:00:00.000Z"
  }
]
```

Si la conexión fue eliminada (soft delete), `connectionName` devuelve `"(eliminada)"`.

---

## Notas operativas

- **Soft delete**: cuando `DELETE` se aplica a una conexión non-PROD, no se elimina físicamente — se marca `isActive: false`. Los backups/restores históricos que la referencian siguen siendo consultables.
- **Listado**: `GET /connections` solo devuelve `isActive: true`. No hay endpoint para listar las soft-deleted.
- **Auditoría**: cada `POST`, `PATCH`, `DELETE` queda registrado en `audit_logs` con `userId`, `userEmail`, `action`, `metadata` (el body completo) y `environment`.
- **Streams**: el dump se sube a R2 vía multipart upload (`@aws-sdk/lib-storage`) directamente desde el stdout del proceso — sin escribir en disco.
