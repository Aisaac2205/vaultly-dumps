# Scheduler Architecture

> 🇪🇸 Versión en español: [../es/scheduler-architecture.md](../es/scheduler-architecture.md)

## Current decision: `@nestjs/schedule` (single-replica)

### What does the scheduler do?

The cronjobs module lets you define automatic backups of production databases on a standard cron expression (`0 2 * * *`, `*/30 * * * *`, etc.). Each trigger invokes `BackupService.createBackup()` with a system user and uploads the dump to Cloudflare R2.

### Cronjob lifecycle

```
POST /cronjobs          → CronjobsService.create()
                        → persists to DB
                        → registers in SchedulerRegistry (if isActive: true)

PUT /backups/settings/:connectionId → CronjobsService.upsertSchedule()
                                    → looks up existing cronjob for that connection
                                    → if none → creates a new one
                                    → if one → updates cronExpression
                                    → reloads in SchedulerRegistry

POST /cronjobs/:id/toggle → toggles isActive in DB
                          → registers or removes from SchedulerRegistry

PATCH /cronjobs/:id     → updates DB
                        → destroys the prior job
                        → recreates with the new configuration

DELETE /cronjobs/:id    → removes from SchedulerRegistry
                        → deletes from DB

App bootstrap           → loads every active cronjob from DB
                        → registers each in SchedulerRegistry
```

> `PUT /backups/settings/:connectionId` is the entry point from the Dumps UI. It lets you configure the schedule directly from the backups view without navigating to the Cronjobs section. Internally it calls `CronjobsService.upsertSchedule()` — it does not create duplicates if a cronjob already exists for that connection.

### Execution state

Every trigger updates the `CronjobEntity`:

| Field | Value |
|-------|-------|
| `lastRunAt` | Start timestamp |
| `lastStatus` | `running` → `completed` / `failed` |
| `nextRunAt` | Next execution (computed from `CronJob.nextDate()`) |

### Dependencies

| Package | Version | Role |
|---------|---------|------|
| `@nestjs/schedule` | ^6.x | NestJS module, exposes `SchedulerRegistry` |
| `cron` | ^4.x | Scheduling engine, provides `CronJob` and `nextDate()` (Luxon DateTime) |

---

## Known limitation: single-replica

The current scheduler runs **in the same process** as the API. That implies:

- If the pod restarts, cronjobs are automatically reloaded from DB on boot (`OnApplicationBootstrap`).
- If you scale to **more than one replica**, **every pod runs every cronjob** → duplicate backups.

This limitation is consciously accepted for the current phase of the project (single replica).

---

## Future migration: BullMQ + Redis

When horizontal scaling becomes necessary, the migration looks like:

### Why BullMQ?

- Tasks enter a **Redis queue** — only one worker processes them.
- `BullMQ` provides "at-least-once" guarantees with distributed locks.
- It supports retries, delays, and state visibility via a UI (`bull-board`).

### Scope of the change

The public contract (`CronjobsController`, `CronjobsRepository`, `CronjobEntity`) **does not change**. Only the internal dispatch layer of `CronjobsService` changes:

```
CURRENT
CronjobsService → SchedulerRegistry → CronJob → BackupService.createBackup()

FUTURE
CronjobsService → BullMQ Queue → Worker → BackupService.createBackup()
```

### Migration steps

1. Add Redis to the infrastructure stack (Docker Compose + K8s).
2. Install `@nestjs/bullmq` and `bullmq`.
3. Replace `SchedulerRegistry` with `Queue` in `CronjobsService`.
4. Create a `CronjobProcessor` (worker) that processes the queued jobs.
5. Drop `@nestjs/schedule` and `cron` if no other module uses them.
6. Keep the `cronjobs` table intact — `cronExpression` becomes the BullMQ repeatable job pattern.

### New infrastructure required

```yaml
# Kubernetes — add to the namespace
- Redis Deployment + Service (or Redis Cluster for HA)
- Secret: REDIS_URL
```

```typescript
// Future definition sketch (do not implement yet)
BullModule.registerQueue({ name: 'backups' })
BullModule.forRoot({ connection: { host, port } })
```

---

## Design decision

> **Date**: 2026-05-06  
> **Context**: The project is not deployed yet. There is no multi-replica infrastructure nor Redis.  
> **Decision**: Use `@nestjs/schedule` to avoid adding Redis as a premature dependency.  
> **Trigger to revisit**: When duplicate backups appear in production, or when scaling the API to more than one pod becomes planned.
