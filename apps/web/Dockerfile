# ── Stage 1: Base ──────────────────────────────────────────────
FROM node:22-alpine AS base
RUN corepack enable

# ── Stage 2: Dev ───────────────────────────────────────────────
FROM base AS dev
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ─────────────────────────────────────────────
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

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @vaultly-control/web build

# ── Stage 4: Production (nginx) ────────────────────────────────
FROM nginx:alpine AS production

COPY --from=build /app/apps/web/dist /usr/share/nginx/html

COPY apps/web/templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY apps/web/docker/10-resolve-nameserver.envsh /docker-entrypoint.d/10-resolve-nameserver.envsh
ENV NGINX_ENVSUBST_FILTER=^(NGINX_RESOLVER|API_UPSTREAM)$
ENV API_UPSTREAM=api:3000

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
