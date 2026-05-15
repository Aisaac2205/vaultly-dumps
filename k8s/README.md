# Kubernetes Manifests — vaultly-control

Production-ready Kubernetes configuration for the vaultly-control monorepo.

## Structure

```
k8s/
├── namespace.yaml              ← vaultly-control namespace
├── configmap.yaml              ← non-secret env vars
├── secret.yaml                 ← sensitive env vars (placeholders only)
├── api/
│   ├── deployment.yaml         ← NestJS API (2 replicas)
│   └── service.yaml            ← ClusterIP :3000
├── web/
│   ├── deployment.yaml         ← nginx SPA (2 replicas)
│   └── service.yaml            ← ClusterIP :80
└── db/
    ├── deployment.yaml         ← PostgreSQL 16 (1 replica)
    ├── service.yaml            ← ClusterIP :5432 (db-service)
    └── pvc.yaml                ← 10Gi persistent storage
```

Cronjobs de backup viven **dentro de la API** (tabla `cronjobs` + `CronjobsService` con `@nestjs/schedule`). No hay manifest de Kubernetes CronJob — los timers se reconstruyen al boot del pod desde la DB.

## Deployment

### 1. Create namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Create secret from .env

```bash
kubectl create secret generic vaultly-control-secret \
  --from-env-file=.env -n vaultly-control
```

> **Important:** The `.env` file must contain at minimum:
> `DB_USER`, `DB_PASSWORD`, `DATABASE_URL`, `R2_ACCOUNT_ID`,
> `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`.
>
> Never commit real secret values to version control.
> For production, consider [sealed-secrets](https://github.com/bitnami-labs/sealed-secrets)
> or [external-secrets-operator](https://external-secrets.io/).

### 3. Apply all manifests

```bash
kubectl apply -f k8s/ -n vaultly-control --recursive
```

### 4. Verify pods

```bash
kubectl get pods -n vaultly-control
```

Expected output:
```
NAME                              READY   STATUS    RESTARTS
vaultly-control-api-xxxxx-xxxxx         1/1     Running   0
vaultly-control-api-yyyyy-yyyyy         1/1     Running   0
vaultly-control-web-xxxxx-xxxxx         1/1     Running   0
vaultly-control-web-yyyyy-yyyyy         1/1     Running   0
vaultly-control-db-xxxxx-xxxxx          1/1     Running   0
```

### 5. View logs

```bash
kubectl logs -f deployment/vaultly-control-api -n vaultly-control
kubectl logs -f deployment/vaultly-control-web -n vaultly-control
kubectl logs -f deployment/vaultly-control-db -n vaultly-control
```

## Debugging

### Port-forward to API

```bash
kubectl port-forward svc/vaultly-control-api 3000:3000 -n vaultly-control
```

Then access `http://localhost:3000` locally.

### Port-forward to web

```bash
kubectl port-forward svc/vaultly-control-web 8080:80 -n vaultly-control
```

Then access `http://localhost:8080` locally.

### Port-forward to database

```bash
kubectl port-forward svc/db-service 5432:5432 -n vaultly-control
```

Then connect with `psql -h localhost -U vaultly_control -d vaultly_control`.

### Exec into a pod

```bash
kubectl exec -it deployment/vaultly-control-api -n vaultly-control -- sh
kubectl exec -it deployment/vaultly-control-db -n vaultly-control -- sh
```

## Backups programados

Los cronjobs de backup se gestionan **dentro de la API** (`CronjobsService` en `apps/api/src/modules/cronjobs/`) con `@nestjs/schedule`. La schedule, frecuencia y connection objetivo se guardan en la tabla `cronjobs`.

Al hacer boot, la API ejecuta `onApplicationBootstrap()` que lee los cronjobs activos de DB y registra los timers en memoria. No hay manifest de Kubernetes CronJob involucrado — el pod restart es el único caso donde los timers se reconstruyen, y ocurre antes de la siguiente ventana.

### Gestionar cronjobs

Via API:
- `PUT /backups/settings/:connectionId` — crear o actualizar schedule (body: `{ cronExpression, frequency, name }`)
- `GET /cronjobs` — listar
- `DELETE /cronjobs/:id` — eliminar

Disparar un backup manual fuera de schedule:
- `POST /backups/trigger/:connectionId` — ejecuta inmediatamente, queda como `category: 'manual'` en R2

## Configuration Notes

### imagePullPolicy

All manifests use `imagePullPolicy: IfNotPresent` for local development
with minikube or kind. **Change to `Always`** in CI/CD pipelines to
ensure the latest image is always pulled.

### Storage Class

The PVC uses `storageClassName: standard`. Adjust to match your provider:

| Provider  | storageClassName |
|-----------|-----------------|
| minikube  | standard        |
| GKE       | standard-rwo    |
| EKS       | gp2 / gp3       |
| AKS       | default         |
| local     | local-path      |

### Health Endpoint

The API deployment references `/health` for readiness and liveness probes.
This endpoint must be implemented in the NestJS API. Recommended approach:

```bash
pnpm add @nestjs/terminus
```

Then create `apps/api/src/health/health.controller.ts` and register
`TerminusModule` + `HealthController` in `AppModule`.

## Scaling

| Component | Replicas | Notes |
|-----------|----------|-------|
| API       | 2        | Stateless, scales horizontally |
| Web       | 2        | Static nginx, scales horizontally |
| DB        | 1        | PostgreSQL — does not scale horizontally; consider Patroni or managed service for HA |
