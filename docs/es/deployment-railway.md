# Deployment — Railway

> 🇬🇧 English version: [../en/deployment-railway.md](../en/deployment-railway.md)

> **Esta guía es un template de deploy, no el único camino.** Vaultly corre en cualquier plataforma de contenedores con una instancia de PostgreSQL 16+. Railway está documentado acá porque te da un stack funcional en menos de una hora, lo cual es útil como punto de partida o para evaluar. Para Kubernetes, Fly.io, AWS ECS, o Docker self-hosted, aplican las mismas variables y servicios — solo cambia la capa de orquestación.

Esta guía muestra cómo deployar Vaultly Control en [Railway](https://railway.com). Auth corre dentro de la API — no se necesita ningún servicio de auth externo.

![Referencia visual de la topología de deploy](../assets/architecture-preview.png)

---

## Project — Vaultly Dumps (app stack)

### Services

| Service | Origen | Builder | Dockerfile | Puerto público |
|---------|--------|---------|------------|----------------|
| `vaultly-web` | GitHub repo (`main`) | Dockerfile | `apps/web/Dockerfile` | `80` |
| `vaultly-api` | GitHub repo (`main`) | Dockerfile | `apps/api/Dockerfile` | `3000` |
| `Postgres` | Plugin Railway | — | — | (interno) |

### Config común para los dos services GitHub

En **Settings → Build**:

- **Root Directory**: `/` (raíz del repo — NO `apps/api` ni `apps/web`)
- **Builder**: Dockerfile
- **Dockerfile Path**: `apps/api/Dockerfile` o `apps/web/Dockerfile` según el service

> **Por qué Root Directory `/`**: los Dockerfiles esperan el contexto desde la raíz del monorepo para acceder a `pnpm-workspace.yaml` y `pnpm-lock.yaml`. Si Railway te ubica en `apps/api`, el build falla.

En **Settings → Networking**:

- Generate Domain → asigna `https://<service>-production.up.railway.app`
- Target Port: `80` para web, `3000` para api

### Variables — `vaultly-api`

```bash
# Runtime
NODE_ENV=production
PORT=3000

# Postgres (reference variables al plugin)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

# Better Auth
BETTER_AUTH_SECRET=<string-hex-de-64-chars>
BETTER_AUTH_URL=https://${{vaultly-api.RAILWAY_PUBLIC_DOMAIN}}
BETTER_AUTH_ADMIN_EMAIL=admin@example.com
BETTER_AUTH_ADMIN_PASSWORD=<password-fuerte>

# CORS — permite al web hablarle al api
CORS_ORIGIN=https://${{vaultly-web.RAILWAY_PUBLIC_DOMAIN}}

# Cloudflare R2 (storage de dumps)
R2_ACCOUNT_ID=<32-char hex de Cloudflare Dashboard>
R2_ACCESS_KEY_ID=<de un R2 API Token>
R2_SECRET_ACCESS_KEY=<del mismo token, solo se muestra al crear>
R2_BUCKET_NAME=vaultly-dumps
```

> **Reference variables**: `${{Postgres.PGHOST}}` y `${{vaultly-web.RAILWAY_PUBLIC_DOMAIN}}` son resueltas automáticamente por Railway al hostname/dominio real del recurso referenciado. Cambian solas si renombrás services.

> **R2_ACCOUNT_ID ≠ R2_ACCESS_KEY_ID**: el primero es el Cloudflare Account ID (visible en el dashboard, arriba a la derecha). El segundo lo genera Cloudflare al crear un R2 API Token. Son strings hex de 32 chars distintos. Confundirlos produce `SSL alert 40` críptico, no un error claro.

### Variables — `vaultly-web`

Las `VITE_*` deben estar **disponibles en build time** porque Vite las hornea en el bundle. Railway las pasa como build args automáticamente cuando están en la pestaña Variables del service.

```bash
VITE_API_URL=https://${{vaultly-api.RAILWAY_PUBLIC_DOMAIN}}
VITE_APP_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

### Orden de creación

1. Agregar el plugin **Postgres** al project.
2. Crear service **vaultly-api**, conectarlo al repo, configurar variables, generar dominio.
3. Crear service **vaultly-web**, conectarlo al repo, configurar variables, generar dominio.
4. Volver al `vaultly-api` y agregar `CORS_ORIGIN` apuntando al dominio del web.


> **Better Auth corre dentro de la API — no se necesita ningún servicio de auth externo.** La API gestiona todo el auth en `/api/auth/*`. Los usuarios y sesiones se almacenan en la misma instancia de PostgreSQL que el resto de los datos de Vaultly.

---

## Gotchas comunes

| Síntoma | Causa real | Fix |
|---------|------------|-----|
| nginx en web devuelve 404 en `/` | Target port en Railway ≠ puerto del Dockerfile | Settings → Networking → cambiar target port a `80` |
| `host not found in upstream` en logs de nginx | nginx.conf hardcodea un hostname que no existe en Railway | Sacar el `proxy_pass`; el web habla directo al dominio público del api |
| `EPROTO ... SSL alert 40` desde api | `R2_ACCOUNT_ID` mal seteado → endpoint inexistente | Confirmar account ID en Cloudflare Dashboard, no confundir con access key |
| SPA carga con strings vacíos en URLs | Variables `VITE_*` no llegaron al build | Confirmar que están como Service Variables (no Shared) y disparar redeploy |
| `flag '--mount=type=cache,...' is missing the cacheKey prefix` | BuildKit de Railway exige `id=s/<service>-...` | Sacar los cache mounts — Railway tiene layer cache propio |

## Releases

El flujo de versionado está en `.github/workflows/ci.yml` + `.releaserc.json`. Cada push a `main` con commit convencional dispara semantic-release: calcula la versión, genera changelog, crea tag y GitHub Release.

Railway redeploya automáticamente en cada push a `main` (configurable per service en Settings → Service → Auto-deploy).
