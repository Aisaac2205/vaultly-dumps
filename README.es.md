# Vaultly

> 🇬🇧 English version: [README.md](README.md)

Plataforma de gestión centralizada de bases de datos. Permite administrar conexiones, ejecutar y programar backups, restaurar dumps, auditar operaciones y monitorear jobs en múltiples entornos desde una única interfaz web.

---

## Stack

| Capa            | Tecnología                    | Versión |
| --------------- | ----------------------------- | ------- |
| Runtime         | Node.js                       | ≥ 22    |
| Package manager | pnpm workspaces               | ≥ 9     |
| Lenguaje        | TypeScript                    | ^5.8.3  |
| Backend         | NestJS                        | ^11.0.7 |
| ORM             | TypeORM                       | ^0.3.20 |
| Frontend        | React                         | ^19.1.0 |
| Build tool      | Vite                          | ^6.3.3  |
| Router          | React Router                  | ^7.5.0  |
| Auth            | Keycloak (OIDC, externo)      | —       |
| Storage         | Cloudflare R2 (S3-compatible) | —       |
| Base de datos   | PostgreSQL 16                 | —       |
| Tiempo real     | Server-Sent Events (SSE)      | —       |

---

## Arquitectura — referencia visual

Dos topologías de deploy de ejemplo. **Ninguna es obligatoria** — Vaultly corre en cualquier plataforma que pueda hostear contenedores Docker y una instancia de PostgreSQL 16+. Elegí la que matchea tu modelo operativo.

### Opción 1 — PaaS push-deploy (recomendada para setup cloud rápido)

Lo mejor cuando querés un **stack funcional en menos de una hora**, incluyendo Keycloak. [Railway](https://railway.com) es el template documentado porque viene con un setup de Keycloak pre-armado que se monta con configuración mínima. El mismo patrón aplica a Fly.io, Render, o cualquier PaaS que buildee imágenes Docker en `git push`.

Walkthrough: [docs/es/deployment-railway.md](docs/es/deployment-railway.md).

![Topología PaaS push-deploy (ejemplo Railway)](docs/assets/architecture-preview.png)

### Opción 2 — GitOps pull-based (recomendada para on-prem, air-gapped o cloud aislado)

Lo mejor cuando necesitás deployar en una **red privada**, un ambiente regulado, o una cuenta cloud que no permite webhooks inbound. Los manifests viven en git, un agent (ArgoCD, Flux) adentro del cluster target los pullea, y los updates de imagen fluyen por el mismo mecanismo. La capa web de Vaultly está diseñada para esto: la config de runtime se inyecta vía `window.APP_CONFIG` (`entrypoint.sh` escribe `config.js` desde las env vars del container antes que arranque nginx) — no hace falta un `.env` en la imagen.

Contrato de deployment (env vars, probes, sizing, restricciones de escalado): [docs/es/deployment-self-host.md](docs/es/deployment-self-host.md). Patrón de config del web: [docs/es/local-development.md](docs/es/local-development.md#configuración-de-entorno-web).

![Topología GitOps pull-based (ejemplo Kubernetes + ArgoCD)](docs/assets/architecture-preview-gitops.png)

### Atajo de decisión

| Tu situación | Camino recomendado |
|--------------|---------------------|
| Evaluando Vaultly, querés tenerlo corriendo hoy | Railway (Opción 1) |
| Equipo chico, cloud público, bien con PaaS de vendor | Railway (Opción 1) |
| Industria regulada, compliance-sensitive | GitOps (Opción 2) |
| DBs on-prem que no se pueden exponer públicamente | GitOps (Opción 2), Vaultly adentro de la red privada |
| Cuenta cloud con firewall estricto solo-egress | GitOps (Opción 2) |
| Multi-entorno, necesitás audit trail completo de deploys en git | GitOps (Opción 2) |


---

## Estructura del monorepo

```
vaultly-control/
│
├── apps/
│   ├── api/                     # NestJS — Monolito Modular  :3000
│   └── web/                     # React + Vite — Vertical Slice  :5173 / :80
│
├── docs/
│   ├── en/                      # Documentación técnica (inglés)
│   └── es/                      # Versión en español
│
├── docker-compose.yml      # Stack en Docker (para CI o servers self-hosted)
├── docker-compose.dev.yml  # Overrides dev (hot reload, perfil 'test' opcional)
│
├── .env                    # Variables activas (no commitear)
├── .env.example            # Plantilla — copiar a .env
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

El monorepo usa **pnpm workspaces** sin Turborepo ni Nx. Workspace activo: `apps/*`.

---

## Primeros pasos

### Prerrequisitos

- Node.js ≥ 22
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker + Docker Compose

### Instalación

```bash
git clone https://github.com/Aisaac2205/vaultly-dumps
cd vaultly-control
pnpm install
```

### Configuración de entorno

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Editar ambos con los valores reales
```

Ver [docs/es/environment-variables.md](docs/es/environment-variables.md) para referencia completa.

> **Keycloak** corre en la nube. Configurar `KEYCLOAK_URL`, `KEYCLOAK_REALM` y `KEYCLOAK_CLIENT_ID` apuntando a la instancia externa.

### Levantar la DB local

```bash
pnpm docker:db
```

### Arrancar en modo desarrollo

```bash
pnpm dev
```

API disponible en `http://localhost:3000` · Frontend en `http://localhost:5173`.

### Levantar todo en Docker

```bash
pnpm docker:dev          # api + web + db con hot reload
pnpm docker:dev:test     # idem + db-test-pg (:5434) + db-test-mysql (:3306)
pnpm docker:prod         # build de producción end-to-end
```

---

## Scripts

| Comando                | Descripción                                           |
| ---------------------- | ----------------------------------------------------- |
| `pnpm dev`             | API + Web en modo watch/hot-reload (Node.js nativo)   |
| `pnpm build`           | Compila todas las apps para producción                |
| `pnpm test`            | Tests de todos los workspaces                         |
| `pnpm lint`            | Linting en todos los workspaces                       |
| `pnpm typecheck`       | Verificación de tipos sin emitir archivos             |
| `pnpm docker:dev`      | Stack completo en Docker con hot reload               |
| `pnpm docker:dev:test` | Idem + DBs de testing (PostgreSQL :5434, MySQL :3306) |
| `pnpm docker:db`       | Solo la DB principal (para correr api/web nativos)    |
| `pnpm docker:prod`     | Build de producción end-to-end                        |

Por workspace:

```bash
pnpm --filter @vaultly-control/api dev
pnpm --filter @vaultly-control/web build
```

---

## Documentación

### Para DevOps — links rápidos

| Lo que necesitás                                  | Dónde mirar                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Correr localmente desde cero                      | [docs/es/local-development.md](docs/es/local-development.md)                           |
| Deployar a Railway (camino PaaS rápido con template de Keycloak) | [docs/es/deployment-railway.md](docs/es/deployment-railway.md)                   |
| Deployar a tu propia infra (K8s, Nomad, Docker, etc.) | [docs/es/deployment-self-host.md](docs/es/deployment-self-host.md)                 |
| Conectar a DBs cloud gestionadas (Neon / RDS)     | [docs/es/connecting-cloud-databases.md](docs/es/connecting-cloud-databases.md)         |
| Conectar a DBs on-premise (SSH tunnels, VPN)      | [docs/es/connecting-on-premise-databases.md](docs/es/connecting-on-premise-databases.md) |
| Operación día a día / runbook                     | [docs/es/devops-runbook.md](docs/es/devops-runbook.md)                                 |
| Troubleshooting                                   | [docs/es/troubleshooting.md](docs/es/troubleshooting.md)                               |
| Hacia dónde va el proyecto (driver+transport)     | [docs/es/architecture-roadmap.md](docs/es/architecture-roadmap.md)                     |

### Empezar

| Doc                                                    | Contenido                                                 |
| ------------------------------------------------------ | --------------------------------------------------------- |
| [local-development.md](docs/es/local-development.md)       | Setup local: Node.js vs Docker, comandos, debugging              |
| [deployment-railway.md](docs/es/deployment-railway.md)     | Walkthrough Railway: services, variables, setup de Keycloak      |
| [deployment-self-host.md](docs/es/deployment-self-host.md) | Contrato de deployment plataforma-agnóstico para K8s/Nomad/etc.  |

### Cómo funciona (dominio)

| Doc                                                                | Contenido                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [flow-database-management.md](docs/es/flow-database-management.md) | Connections: environments, permisos por engine, ciclo de vida |
| [scheduler-architecture.md](docs/es/scheduler-architecture.md)     | Cronjobs, SchedulerRegistry, single-replica                   |
| [security-model.md](docs/es/security-model.md)                     | Invariantes de PROD, audit, autorización (con refs a código)  |

### Operaciones (DevOps)

| Doc                                                                                      | Contenido                                                   |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [connecting-cloud-databases.md](docs/es/connecting-cloud-databases.md)                   | Setup de DBs gestionadas: Neon, RDS, Supabase, Azure, GCP   |
| [connecting-on-premise-databases.md](docs/es/connecting-on-premise-databases.md)         | Patrones on-prem: self-host, VPN, túnel SSH                 |
| [devops-runbook.md](docs/es/devops-runbook.md)                                           | Checklist pre-prod, monitoreo, rotaciones, incidentes       |
| [troubleshooting.md](docs/es/troubleshooting.md)                                         | Índice síntoma → causa → fix                                |

### Arquitectura técnica

| Doc                                                          | Contenido                                                 |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| [architecture.md](docs/es/architecture.md)                   | Módulos API, estructura web, SSE                          |
| [infrastructure.md](docs/es/infrastructure.md)               | Docker Compose local, credenciales de testing             |
| [architecture-roadmap.md](docs/es/architecture-roadmap.md)   | Diseño propuesto driver+transport (NO implementado)       |

### Referencia

| Doc                                                          | Contenido                                 |
| ------------------------------------------------------------ | ----------------------------------------- |
| [environment-variables.md](docs/es/environment-variables.md) | Todas las variables con tipos y defaults  |
| [database-migrations.md](docs/es/database-migrations.md)     | TypeORM migrations: generate, run, revert |
| [conventions.md](docs/es/conventions.md)                     | Nombrado, imports, commits, TypeScript    |
