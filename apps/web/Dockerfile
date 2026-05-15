# syntax=docker/dockerfile:1

# ── Stage 1: Base ──────────────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable

# ── Stage 2: Dev ───────────────────────────────────────────────
# Target del compose dev. Instala todas las deps (devDeps incluidos
# para vite + tsc). El source code entra por bind-mount y el CMD
# lo pone el compose (pnpm --filter ... dev).
#
# Dev corre como root: el bind-mount del compose tiene ownership
# del host. Cambiar a USER aquí complicaría DX sin agregar seguridad.
FROM base AS dev
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/

# BuildKit cache mount: el store de pnpm se persiste entre builds
# en el daemon de Docker, así cambios en deps no re-descargan todo.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 3: Build ─────────────────────────────────────────────
# Install + vite build → bundle estático en apps/web/dist.
# NO usamos pnpm deploy porque el output final es HTML/CSS/JS
# servido por nginx — no hay node_modules en runtime.
FROM base AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/vite.config.ts ./apps/web/
COPY apps/web/components.json ./apps/web/
COPY apps/web/index.html ./apps/web/
COPY apps/web/public ./apps/web/public
COPY apps/web/src ./apps/web/src

# Vite build-time environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_KEYCLOAK_URL
ENV VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL

ARG VITE_KEYCLOAK_REALM
ENV VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM

ARG VITE_KEYCLOAK_CLIENT_ID
ENV VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID

ARG VITE_APP_BASE_URL
ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL

RUN pnpm --filter @vaultly-control/web build

# ── Stage 4: Production (nginx) ────────────────────────────────
# nginx:alpine ya viene con:
# - user `nginx` (UID 101) — workers corren como non-root por default
# - signal handling propio en el master process (no necesita tini)
# - su propio entrypoint con templating runtime
FROM nginx:alpine AS production

# Copy built SPA
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint (injects runtime config from container env vars)
COPY apps/web/entrypoint.sh /docker-entrypoint.d/99-config.sh
RUN chmod +x /docker-entrypoint.d/99-config.sh

EXPOSE 80

# Healthcheck básico sirviendo el index.html → confirma que nginx
# está arriba y los estáticos están en su lugar.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
