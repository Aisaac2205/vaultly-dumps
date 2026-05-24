# Variables de entorno — Vaultly Control

> 🇬🇧 English version: [../en/environment-variables.md](../en/environment-variables.md)

Ver los `.env.example` de cada app como fuente de verdad de qué variables existen. **Nunca commitear archivos `.env` con valores reales** — están en `.gitignore`.

---

## API (`apps/api/.env`)

Variables validadas por `src/config/env.validation.ts`. Las marcadas como **required** rompen el arranque si no están definidas.

```bash
# ── Database (required) ────────────────────────────────────────
DATABASE_URL=postgresql://vaultly_control:changeme@localhost:5432/vaultly_control

# ── Server ─────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173        # required en production

# ── Keycloak (required — instancia externa en la nube) ─────────
KEYCLOAK_URL=https://<your-keycloak-url>/
KEYCLOAK_REALM=vaultly-control
KEYCLOAK_CLIENT_ID=vaultly-control-api

# ── Cifrado (required) ─────────────────────────────────────────
# Clave para cifrar passwords de conexiones en reposo (AES-256-GCM).
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<string-hex-de-64-chars>

# ── Cloudflare R2 (opcional en dev, required en producción) ────
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key-id>
R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
R2_BUCKET_NAME=vaultly-control-dumps
R2_PUBLIC_BASE_URL=

# ── Seed script (vars individuales para dev local) ─────────────
# Nota: DB_NAME/DB_USER usan underscore porque PostgreSQL no acepta
# guiones en identifiers unquoted.
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vaultly_control
DB_USER=vaultly_control
DB_PASSWORD=changeme
```

> En Docker Compose, `DATABASE_URL` usa el nombre del servicio como host (`db` en lugar de `localhost`).

---

## Web (`apps/web/.env`)

```bash
# ── Vite build-time variables ──────────────────────────────────
# Se inyectan en el bundle estático en el momento del build.
# Nunca incluir secretos — son públicas en el cliente.

# Backend API URL (axios + SSE hook)
VITE_API_URL=http://localhost:3000

# Keycloak OIDC (keycloak-js SDK)
VITE_KEYCLOAK_URL=https://<your-keycloak-url>/
VITE_KEYCLOAK_REALM=vaultly-control
VITE_KEYCLOAK_CLIENT_ID=vaultly-control-web

# App base URL (redirects y callbacks)
VITE_APP_BASE_URL=http://localhost:5173
```

> En producción, estos valores se pasan como `ARG` en el Dockerfile y se queman en el build estático. El contenedor nginx no tiene variables de entorno en runtime.

---

## Docker Compose (`.env` en la raíz)

Ambos compose (`docker-compose.yml` y `docker-compose.dev.yml`) leen el mismo `.env` raíz vía `env_file: .env`. Ya no existe `.env.local`: se consolidó.

Variables obligatorias para que `docker compose up` no aborte (fail-loud con `${VAR:?...}` en el compose):

```bash
# ── Database (obligatorias) ────────────────────────────────────
DB_NAME=vaultly_control
DB_USER=vaultly_control
DB_PASSWORD=  # ← REQUERIDA, sin default

# URL usada por la API para conectarse al servicio `db` interno
DATABASE_URL=postgresql://vaultly_control:CHANGE_ME@db:5432/vaultly_control

# ── Server ─────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://vaultly-control.miempresa.com  # required en production

# ── Keycloak (obligatorias) ────────────────────────────────────
KEYCLOAK_URL=https://auth.miempresa.com
KEYCLOAK_REALM=vaultly-control
KEYCLOAK_CLIENT_ID=vaultly-control-api

# ── Cloudflare R2 (vacíos OK en development) ───────────────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=vaultly-control-dumps
R2_PUBLIC_BASE_URL=
```

Ver `.env.example` en la raíz para la plantilla completa con todas las claves y comentarios.
