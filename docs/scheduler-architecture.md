# Scheduler Architecture

## Decisión actual: `@nestjs/schedule` (single-replica)

### ¿Qué hace el scheduler?

El módulo de cronjobs permite definir backups automáticos de bases de datos de producción en una expresión cron estándar (`0 2 * * *`, `*/30 * * * *`, etc.). Cada disparo invoca `BackupService.createBackup()` con un usuario de sistema y sube el dump a Cloudflare R2.

### Flujo de vida de un cronjob

```
POST /cronjobs          → CronjobsService.create()
                        → guarda en DB
                        → registra en SchedulerRegistry (si isActive: true)

PUT /backups/settings/:connectionId → CronjobsService.upsertSchedule()
                                    → busca cronjob existente para esa conexión
                                    → si no existe → crea uno nuevo
                                    → si existe → actualiza cronExpression
                                    → recarga en SchedulerRegistry

POST /cronjobs/:id/toggle → toggle isActive en DB
                          → registra o elimina del SchedulerRegistry

PATCH /cronjobs/:id     → actualiza DB
                        → destruye el job anterior
                        → recrea con la nueva configuración

DELETE /cronjobs/:id    → elimina del SchedulerRegistry
                        → elimina de DB

App bootstrap           → carga todos los cronjobs activos de DB
                        → registra cada uno en SchedulerRegistry
```

> `PUT /backups/settings/:connectionId` es el punto de entrada desde la UI de Dumps. Permite configurar el schedule directamente desde la vista de backups sin navegar a la sección de Cronjobs. Internamente llama a `CronjobsService.upsertSchedule()` — no crea duplicados si ya existe un cronjob para esa conexión.

### Estado de ejecución

Cada disparo actualiza la entidad `CronjobEntity`:

| Campo | Valor |
|-------|-------|
| `lastRunAt` | Timestamp de inicio |
| `lastStatus` | `running` → `completed` / `failed` |
| `nextRunAt` | Próxima ejecución (calculada desde `CronJob.nextDate()`) |

### Dependencias

| Paquete | Versión | Rol |
|---------|---------|-----|
| `@nestjs/schedule` | ^6.x | Módulo NestJS, expone `SchedulerRegistry` |
| `cron` | ^4.x | Motor de scheduling, provee `CronJob` y `nextDate()` (Luxon DateTime) |

---

## Limitación conocida: single-replica

El scheduler actual corre **en el mismo proceso** que la API. Esto implica:

- Si el pod reinicia, los cronjobs se recargan automáticamente desde DB al levantar (`OnApplicationBootstrap`).
- Si se escala a **más de una réplica**, **cada pod ejecuta todos los cronjobs** → backups duplicados.

Esta limitación es aceptada conscientemente para la fase actual del proyecto (una sola réplica).

---

## Migración futura: BullMQ + Redis

Cuando se requiera escalar horizontalmente, la migración implica:

### ¿Por qué BullMQ?

- Las tareas entran a una **cola Redis** — solo un worker las procesa.
- `BullMQ` garantiza "at-least-once" con locks distribuidos.
- Soporta reintentos, delays, y visibilidad del estado desde una UI (`bull-board`).

### Alcance del cambio

El contrato público (`CronjobsController`, `CronjobsRepository`, `CronjobEntity`) **no cambia**. Solo cambia la capa de despacho interna de `CronjobsService`:

```
ACTUAL
CronjobsService → SchedulerRegistry → CronJob → BackupService.createBackup()

FUTURO
CronjobsService → BullMQ Queue → Worker → BackupService.createBackup()
```

### Pasos de migración

1. Agregar Redis al stack de infraestructura (Docker Compose + K8s).
2. Instalar `@nestjs/bullmq` y `bullmq`.
3. Reemplazar `SchedulerRegistry` por `Queue` en `CronjobsService`.
4. Crear un `CronjobProcessor` (worker) que procese los jobs de la cola.
5. Eliminar `@nestjs/schedule` y `cron` si ya no se usan en otros módulos.
6. Mantener la tabla `cronjobs` intacta — `cronExpression` se convierte en el patrón del job repetible de BullMQ.

### Nueva infraestructura requerida

```yaml
# Kubernetes — agregar al namespace
- Redis Deployment + Service (o Redis Cluster para HA)
- Secret: REDIS_URL
```

```typescript
// Ejemplo de definición futura (no implementar aún)
BullModule.registerQueue({ name: 'backups' })
BullModule.forRoot({ connection: { host, port } })
```

---

## Decisión de diseño

> **Fecha**: 2026-05-06  
> **Contexto**: El proyecto no está deployado aún. No existe infraestructura multi-réplica ni Redis.  
> **Decisión**: Usar `@nestjs/schedule` para evitar agregar Redis como dependencia prematura.  
> **Trigger para revisar**: Cuando se detecten backups duplicados en producción o se planifique escalar la API a más de un pod.
