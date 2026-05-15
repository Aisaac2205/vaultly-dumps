# syntax=docker/dockerfile:1

# ── Stage 1: Base ──────────────────────────────────────────────
# Debian-slim (not Alpine) for two reasons:
# - postgresql-client-18 from PGDG (Debian bookworm default es 15, pero
#   pg_dump se niega a dumpear de un server con major version mayor que
#   la propia — el cliente debe igualar o exceder al server).
# - Percona Server client para MySQL 8+ caching_sha2_password (Alpine
#   solo trae mariadb-client, que no implementa ese auth plugin).
FROM node:22-bookworm-slim AS base
RUN corepack enable

# Versión del cliente PostgreSQL. Debe ser >= versión major del server
# más nuevo al que el API hace backup. Override en build-time:
#   docker compose build --build-arg POSTGRES_CLIENT_VERSION=19 api
# o vía docker-compose.yml build.args.
ARG POSTGRES_CLIENT_VERSION=18

# OS deps: tini (signal handling para PID 1) + DB clients para backup/restore.
RUN apt-get update \
     && apt-get install -y --no-install-recommends \
     ca-certificates \
     curl \
     gnupg \
     postgresql-common \
     tini \
     # PGDG apt repo (PostgreSQL Global Development Group). El helper de
     # postgresql-common agrega el source y la GPG key transparentemente
     # — sin hardcodear claves que rotan. La versión sale del ARG de
     # arriba para que el bump sea explícito en build interface.
     && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y \
     && apt-get install -y --no-install-recommends postgresql-client-${POSTGRES_CLIENT_VERSION} \
     # Percona client para MySQL 8+. Elegido sobre el apt oficial de Oracle
     # porque percona-release rota la GPG key automáticamente; las de Oracle
     # expiran cada año y requieren rotación manual en el Dockerfile.
     && curl -fsSL https://repo.percona.com/apt/percona-release_latest.generic_all.deb \
     -o /tmp/percona-release.deb \
     && apt-get install -y /tmp/percona-release.deb \
     && rm /tmp/percona-release.deb \
     && percona-release setup ps80 \
     && apt-get install -y --no-install-recommends percona-server-client \
     && apt-get purge -y --auto-remove curl gnupg \
     && rm -rf /var/lib/apt/lists/*

# ── Stage 2: Dev ───────────────────────────────────────────────
# Target del compose dev. Instala todas las deps (incluyendo devDeps
# para nest start --watch / tsc) y se queda esperando el source code
# vía bind-mount + el CMD del compose (pnpm --filter ... dev).
#
# Dev corre como root: el bind-mount del compose puede tener ownership
# del host que no coincide con node user — meter USER aquí complicaría
# DX sin agregar seguridad (es un entorno local efímero).
FROM base AS dev
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/

# BuildKit cache mount: el store de pnpm se persiste entre builds
# en el daemon de Docker, así cambios en deps no re-descargan todo.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 3: Build ─────────────────────────────────────────────
# Install + compile + pnpm deploy. NO copia node_modules de otro
# stage — pnpm con symlinks no sobrevive a un COPY entre stages.
FROM base AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/src ./apps/api/src

RUN pnpm --filter @vaultly-control/api build

# pnpm deploy arma un directorio standalone en /prod/api:
# - node_modules/ aplanado (sin symlinks al store global)
# - solo prod deps (--prod)
# - los archivos declarados en "files" del package.json (dist/)
# Es lo que vamos a copiar tal cual al stage de producción.
#
# Requiere inject-workspace-packages=true en el .npmrc raíz (default
# de pnpm v10+). Ese flag debe estar grabado en el lockfile también
# — si cambia, hay que correr `pnpm install` localmente y commitear
# el nuevo pnpm-lock.yaml (sino falla con ERR_PNPM_LOCKFILE_CONFIG_MISMATCH).
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter @vaultly-control/api --prod deploy /prod/api

# ── Stage 4: Production ────────────────────────────────────────
FROM base AS production
WORKDIR /app

# node:22-bookworm-slim trae usuario `node` (UID/GID 1000) por default.
# COPY --chown garantiza que el non-root pueda leer todos los archivos.
COPY --from=build --chown=node:node /prod/api ./

# AVISO: si la API escribe archivos a paths fuera de /app (uploads,
# dumps locales, etc.), el user `node` necesita ownership. El flujo
# de backup actual stream-a-R2 no escribe a disco, así que no aplica.
USER node

EXPOSE 3000

# HEALTHCHECK definido en la imagen → válido también fuera de compose
# (k8s, ECS, runners CI). El módulo http de Node evita depender de
# curl/wget (purgados en base).
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# tini como PID 1: maneja SIGTERM/SIGINT correctamente y previene
# procesos zombies. Sin esto, Node corre como PID 1 e ignora los
# signals default de Docker → docker stop espera el timeout completo
# antes de hacer SIGKILL, rompiendo graceful shutdowns.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/main.js"]
