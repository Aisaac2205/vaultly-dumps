# Convenciones — Vaultly Control

## Nombrado de archivos

- Módulos del API: nombres planos dentro de su carpeta de dominio — `service.ts`, `controller.ts`, `module.ts`. El contexto lo da la carpeta (ej: `modules/backup/service.ts`).
- Componentes React: PascalCase — `StatusBadge.tsx`, `Layout.tsx`.
- Hooks: camelCase con prefijo `use` — `useConnections.ts`, `useBackupHistory.ts`.
- Enums del backend: `kebab-case.enum.ts` en `apps/api/src/database/enums/` (ej: `backup-category.enum.ts`). Son la fuente de verdad de los valores cross-app.
- Tipos del frontend que duplican enums del backend: `kebab-case.types.ts` en `apps/web/src/types/` o en `features/<feature>/types.ts`.

---

## Imports

- Nunca importar entre apps directamente (`apps/web` no importa de `apps/api`).
- No hay paquete compartido. Los contratos cross-app (enums / string unions usados en DTOs, query params, payloads) se **duplican**:
  - **Backend** es la source of truth: enums TypeScript en `apps/api/src/database/enums/`, validados en runtime con `@IsEnum` de class-validator.
  - **Frontend** replica los valores literales como union types en `apps/web/src/types/` o `features/<feature>/types.ts`.
- Si agregás un valor nuevo a un enum del backend, replicalo en el union type del frontend en el mismo PR. La validación con `@IsEnum` cortará cualquier request del frontend que mande un valor que se olvidó de sincronizar.

---

## Variables de entorno

- Nunca commitear `.env` con valores reales — están en `.gitignore`.
- Los `.env.example` son la fuente de verdad de qué variables existen.
- Variables del frontend deben comenzar con `VITE_` para que Vite las inyecte en el bundle.
- En Kubernetes: valores no sensibles en `configmap.yaml`, sensibles en `secret.yaml`.

---

## Commits — Conventional Commits

```
feat(backup): add on-demand backup endpoint
fix(connections): handle connection timeout gracefully
chore(deps): upgrade NestJS to 11.0.7
docs(readme): update environment variables reference
refactor(auth): simplify Keycloak strategy initialization
```

Scopes habituales: `backup`, `restore`, `connections`, `jobs`, `audit`, `auth`, `web`, `infra`, `deps`.

---

## TypeScript

Config en dos niveles:

**`tsconfig.base.json` (raíz)** — opciones compartidas:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

**Cada app extiende la base:**

- `apps/api` — agrega `"module": "CommonJS"`, `emitDecoratorMetadata: true`, `experimentalDecorators: true` (requeridos por NestJS).
- `apps/web` — agrega `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"` (Vite bundler mode).

---

## pnpm workspaces

**`.npmrc`:**

```ini
shamefully-hoist=false        # Aislamiento estricto: evita phantom dependencies
strict-peer-dependencies=false
auto-install-peers=true
link-workspace-packages=true  # Resuelve workspace:* via symlinks locales
```
