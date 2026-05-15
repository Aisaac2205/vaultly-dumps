# Vaultly Control — Agent Guide

## Monorepo Structure

```
vaultly-dumps/
└── apps/
    ├── api/          # NestJS 11 backend (TypeORM + PostgreSQL)
    └── web/          # React 19 frontend (Vite + React Router 7)
```

**Package manager:** pnpm workspaces (`pnpm-workspace.yaml`, includes `apps/*` only)
**Node:** >=22 | **pnpm:** >=9

### Workspace Dependencies

| Package                | Key Dependencies                                               |
| ---------------------- | -------------------------------------------------------------- |
| `@vaultly-control/api` | NestJS 11, TypeORM, PostgreSQL, Passport, Swagger, Joi         |
| `@vaultly-control/web` | React 19, React Router 7, Vite, TanStack Query, radix-ui, cmdk |

There is no shared package. Cross-app contracts (enums / string unions for DTOs, query params, etc.) are duplicated: the **backend is the source of truth**, the frontend mirrors the literal values. Drift is caught by `@IsEnum` validators on the backend, not by a shared type.

### Scripts (root)

```bash
pnpm dev          # Run all apps in parallel
pnpm build        # Build all apps in parallel
pnpm lint         # Lint all packages
pnpm test         # Test all packages
pnpm typecheck    # Type-check all packages
```

Per-package scripts: `pnpm --filter @vaultly-control/api dev`, etc.

---

## Available Skills

Located in `.agents/skills/`. Auto-load based on context.

| Skill                         | Trigger                                                                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **nestjs-best-practices**     | Writing, reviewing, or refactoring NestJS code. Covers architecture, DI, security, testing, database, API design, microservices, DevOps. 40 rules prioritized CRITICAL → LOW.       |
| **react-dev**                 | Building React components with TypeScript. Covers React 19 patterns (ref as prop, useActionState, use()), generic components, event typing, hooks, routing (TanStack/React Router). |
| **typescript-react-reviewer** | Reviewing React/TypeScript code. Detects useEffect abuse, state mutation, missing cleanup, `any` types, React 19 hook mistakes. Priority: Critical → High → Style.                  |
| **find-skills**               | User asks "how do I do X", "find a skill for", or wants to extend agent capabilities. Uses `npx skills` CLI to search/install from ecosystem.                                       |

### Skill Loading Rules

1. Check file paths being touched — `.ts` in `apps/api/src/` → load `nestjs-best-practices`
2. `.tsx`/`.ts` in `apps/web/src/` → load `react-dev` (writing) or `typescript-react-reviewer` (reviewing)
3. User asks for external skill/capability → load `find-skills`
4. Multiple skills can apply simultaneously

---

## Conventions

- **TypeScript everywhere** — strict mode, no `any` without justification
- **Feature-based organization** in NestJS (not by technical layer)
- **React 19** — no `forwardRef` (use `ref` as prop), no `useFormState` (use `useActionState`)
- **Cross-app contracts** are duplicated, not shared. Backend enums live in `apps/api/src/database/enums/` (source of truth, validated with `@IsEnum`). Frontend mirrors the literal union types in `apps/web/src/types/` or per-feature `types.ts`.
- **Never** commit secrets, `.env` files, or build artifacts
