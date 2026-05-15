# Environment Variables — Vaultly Control

> 🇪🇸 Versión en español: [../es/environment-variables.md](../es/environment-variables.md)

The `.env.example` file inside each app is the source of truth for which variables exist. **Never commit `.env` files with real values** — they are in `.gitignore`.

---

## API (`apps/api/.env`)

Variables are validated by `src/config/env.validation.ts`. The ones marked as **required** break startup if undefined.

```bash
# ── Database (required) ────────────────────────────────────────
DATABASE_URL=postgresql://vaultly_control:changeme@localhost:5432/vaultly_control

# ── Server ─────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173        # required in production

# ── Keycloak (required — external cloud instance) ──────────────
KEYCLOAK_URL=https://<your-keycloak-url>/
KEYCLOAK_REALM=vaultly-control
KEYCLOAK_CLIENT_ID=vaultly-control-api

# ── Cloudflare R2 (optional in dev, required in production) ────
R2_ACCOUNT_ID=<your-cloudflare-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key-id>
R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
R2_BUCKET_NAME=vaultly-control-dumps
R2_PUBLIC_BASE_URL=

# ── Seed script (individual vars for local dev) ────────────────
# Note: DB_NAME/DB_USER use underscore because PostgreSQL does
# not accept hyphens in unquoted identifiers.
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vaultly_control
DB_USER=vaultly_control
DB_PASSWORD=changeme
```

> In Docker Compose, `DATABASE_URL` uses the service name as the host (`db` instead of `localhost`).

---

## Web (`apps/web/.env`)

```bash
# ── Vite build-time variables ──────────────────────────────────
# Baked into the static bundle at build time.
# Never include secrets — they are public in the client.

# Backend API URL (axios + SSE hook)
VITE_API_URL=http://localhost:3000

# Keycloak OIDC (keycloak-js SDK)
VITE_KEYCLOAK_URL=https://<your-keycloak-url>/
VITE_KEYCLOAK_REALM=vaultly-control
VITE_KEYCLOAK_CLIENT_ID=vaultly-control-web

# App base URL (redirects and callbacks)
VITE_APP_BASE_URL=http://localhost:5173
```

> In production, these values are passed as `ARG` in the Dockerfile and burned into the static build. The nginx container has no runtime environment variables.

---

## Docker Compose (`.env` at the root)

Both compose files (`docker-compose.yml` and `docker-compose.dev.yml`) read the same root `.env` via `env_file: .env`. There is no `.env.local` anymore: it was consolidated.

Mandatory variables for `docker compose up` not to abort (fail-loud with `${VAR:?...}` in the compose):

```bash
# ── Database (mandatory) ───────────────────────────────────────
DB_NAME=vaultly_control
DB_USER=vaultly_control
DB_PASSWORD=  # ← REQUIRED, no default

# URL used by the API to connect to the internal `db` service
DATABASE_URL=postgresql://vaultly_control:CHANGE_ME@db:5432/vaultly_control

# ── Server ─────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://vaultly-control.mycompany.com  # required in production

# ── Keycloak (mandatory) ───────────────────────────────────────
KEYCLOAK_URL=https://auth.mycompany.com
KEYCLOAK_REALM=vaultly-control
KEYCLOAK_CLIENT_ID=vaultly-control-api

# ── Cloudflare R2 (empty OK in development) ────────────────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=vaultly-control-dumps
R2_PUBLIC_BASE_URL=
```

See the root `.env.example` for the full template with every key and comment.
