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

# Layer cache de Docker se reusa si package.json y pnpm-lock.yaml
# no cambiaron — suficiente para builds remotos (Railway) y locales.
RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ─────────────────────────────────────────────
# Install + vite build → bundle estático en apps/web/dist.
# NO usamos pnpm deploy porque el output final es HTML/CSS/JS
# servido por nginx — no hay node_modules en runtime.
FROM base AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

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

RUN pnpm --filter @vaultly-control/web build

# ── Stage 4: Production (nginx) ────────────────────────────────
# nginx:alpine ya viene con:
# - user `nginx` (UID 101) — workers corren como non-root por default
# - signal handling propio en el master process (no necesita tini)
# - su propio entrypoint con templating runtime (envsubst sobre
#   /etc/nginx/templates/*.template) y soporte para scripts .envsh en
#   /docker-entrypoint.d/, sourced ANTES del paso de templating — es
#   como resolvemos el DNS interno (Docker embebido vs. Railway) sin
#   hardcodear una IP de resolver específica de plataforma.
FROM nginx:alpine AS production

# Copy built SPA
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# nginx config vive como template: /api/* se resuelve a runtime, no al
# arrancar el container (esa resolución al arrancar es justo lo que
# tumbaba este proxy antes — ver docs/en/deployment-railway.md).
COPY apps/web/templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY apps/web/docker/10-resolve-nameserver.envsh /docker-entrypoint.d/10-resolve-nameserver.envsh

# Restringe el envsubst del templating oficial a estas dos variables,
# para no tocar por accidente los $variables de nginx (ej. $remote_addr)
# que aparecen dentro del template.
ENV NGINX_ENVSUBST_FILTER=^(NGINX_RESOLVER|API_UPSTREAM)$
# Default para docker-compose, donde el servicio de la API se llama
# literalmente "api". En Railway se sobreescribe con
# vaultly-api.railway.internal:<puerto>.
ENV API_UPSTREAM=api:3000

EXPOSE 80

# Healthcheck básico sirviendo el index.html → confirma que nginx
# está arriba y los estáticos están en su lugar.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
