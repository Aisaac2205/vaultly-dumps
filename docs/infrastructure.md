# Infraestructura — Vaultly Control

## Docker

### Dockerfiles

Ambos Dockerfiles son multi-stage y viven junto a su app:

| Archivo | Stages |
|---------|--------|
| `apps/api/Dockerfile` | `build` (compilación TS) → `production` (Node mínimo) |
| `apps/web/Dockerfile` | `build` (Vite build) → `production` (nginx, puerto 80) |

### Docker Compose

| Archivo | Propósito |
|---------|-----------|
| `docker-compose.yml` | Producción: `api`, `web`, `db` con healthchecks, sin puertos expuestos para `db` |
| `docker-compose.dev.yml` | Override de desarrollo (hot reload, puertos abiertos, perfil `test` para DBs de testing) |

> **Keycloak** corre en la nube. Configurar `KEYCLOAK_URL`, `KEYCLOAK_REALM` y `KEYCLOAK_CLIENT_ID` en `.env` apuntando al entorno externo.

> **`docker-compose.dev.yml` NO es auto-cargado** (renombrado desde `docker-compose.override.yml` para que `docker compose up` sin flags en un servidor de prod no arranque dev). Siempre pasar `-f` doble o usar scripts de `pnpm`.

### Levantar entorno de desarrollo local

```bash
# Solo la DB (si corrés API y Web con pnpm dev)
pnpm docker:db

# Stack completo en contenedores con hot reload
pnpm docker:dev
```

### Levantar infra de testing de conexiones

```bash
# Stack completo + DBs de testing (PostgreSQL :5434 + MySQL :3306)
pnpm docker:dev:test

# Solo databases (api/web nativas)
pnpm docker:db:test
```

Las DBs de testing están bajo `profiles: ["test"]` en `docker-compose.dev.yml` — solo arrancan con `--profile test`.

Credenciales de testing:

| Engine | Host | Port | Database | User | Password |
|--------|------|------|----------|------|----------|
| PostgreSQL | localhost | 5434 | testdb | test_user | test_pass123 |
| MySQL | localhost | 3306 | testdb | test_user | test_pass123 |

---

## Kubernetes

**Ruta:** `k8s/` — estructura Kustomize-ready.

### Manifiestos

| Ruta | Descripción |
|------|-------------|
| `namespace.yaml` | Namespace `vaultly-control` |
| `configmap.yaml` | Variables no sensibles (URLs, realm, nombres de bucket, `DB_NAME`) |
| `secret.yaml` | Variables sensibles (credenciales DB, R2). **Nunca commitear valores reales** |
| `api/deployment.yaml` | Deployment del pod `api` con readiness/liveness probes en `/health` |
| `api/service.yaml` | Service ClusterIP — puerto 3000 |
| `web/deployment.yaml` | Deployment del pod `web` (nginx con build estático) |
| `web/service.yaml` | Service ClusterIP — puerto 80 |
| `db/deployment.yaml` | Deployment PostgreSQL 16 |
| `db/service.yaml` | Service ClusterIP — puerto 5432 (nombre: `db-service`) |
| `db/pvc.yaml` | PersistentVolumeClaim para datos de PostgreSQL |
| `cronjob/backup-cronjob.yaml` | CronJob — backup diario 2:00 AM UTC |

### Aplicar en un cluster

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

> Para entornos específicos (staging, producción), crear overlays con `kustomization.yaml` que parcheen los manifiestos base.

### Health endpoint

El `api/deployment.yaml` configura liveness y readiness probes contra `GET /health`. El módulo `@nestjs/terminus` ya está instalado. Implementar el endpoint antes de deploy a K8s:

```
apps/api/src/health/health.controller.ts  # GET /health
apps/api/src/health/health.module.ts
```
