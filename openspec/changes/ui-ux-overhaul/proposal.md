# Proposal: UI/UX Overhaul

## Intent

User feedback: "minimalista pero lo siento plano, cards genéricos de IA. Mal UX". The current UI lacks polish, enterprise feel, and modern motion. Goal: enterprise-grade UI with smooth animations, Vercel/Linear aesthetic, full accessibility, while keeping the existing minimalist foundation.

## Scope

### In Scope
- Semantic color tokens with accent `#2563EB`, easing/duration tokens, dark-mode slots (design only)
- Shared UI primitives rewrite: button, card, stat-card, dialog, sheet, popover, data-table
- New primitives: pagination, filters compound component, motion primitives (FadeIn, Stagger, PressFeedback)
- Sidebar + Layout redesign: topbar, active indicators, page transitions
- Backend pagination for backups + audit (real, not mock)
- Feature adoption across 8 features + LoginPage polish
- `prefers-reduced-motion` compliance everywhere

### Out of Scope
- Full dark mode implementation (tokens ship with dark-mode slots, implementation deferred)
- Mobile-app native considerations
- New backend features beyond pagination
- React Router data router migration
- Form library migration (react-hook-form) — current pattern stays
- i18n beyond Spanish — single-locale stays
- Animation library swap (`motion` is locked)

## Capabilities

> Contract for sdd-spec: each new capability → `openspec/specs/<name>/spec.md`. Each modified → delta spec.

### New Capabilities
- `pagination`: Backend paginated responses + frontend pagination component with Spanish labels, prefetch on hover, page-size selector
- `filter-compound`: Popover-based compound filter component with active chips, instant/submit modes
- `motion-primitives`: FadeIn, Stagger, PressFeedback components using `motion/react` with `useReducedMotion()`
- `topbar-navigation`: Desktop topbar with breadcrumbs, user menu, dark-mode toggle slot

### Modified Capabilities
- `shared-ui-components`: Button (active press), card (variants), stat-card (outline + BadgeDot), dialog/sheet/popover (entry animations), data-table (pagination slot, remove table-fixed)
- `sidebar-navigation`: Active state redesign (surface highlight + hairline indicator), token-based colors
- `backup-api`: Add pagination to list endpoints (DTOs, repo, service, controller)
- `audit-api`: Add pagination to list endpoints (DTOs, repo, service, controller)

## Approach

5-phase chained PRs stacked-to-main: Foundation (tokens + motion) → Shared UI (primitives) → Layout & Nav (shell) → Pagination backend → Features (8 sub-PRs + login polish). Each PR independently mergeable. Shared primitives introduced before feature adoption to avoid copy-paste.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/shared/ui/*` | Modified | button, card, stat-card, dialog, sheet, popover, data-table |
| `apps/web/src/shared/ui/pagination.tsx` | New | Pagination component |
| `apps/web/src/shared/ui/filters.tsx` | New | Filter compound component |
| `apps/web/src/shared/ui/motion/` | New | FadeIn, Stagger, PressFeedback |
| `apps/web/src/shared/components/Sidebar.tsx` | Modified | Active state, token colors |
| `apps/web/src/shared/components/Layout.tsx` | Modified | Topbar, page transitions |
| `apps/web/src/shared/styles/globals.css` | Modified | Tokens, easings, dark-mode slots |
| `apps/web/src/features/*` (9) | Modified | Adopt new primitives |
| `apps/web/package.json` | Modified | Add `motion` |
| `apps/api/src/modules/backup/dto/` | New | Pagination query DTO |
| `apps/api/src/modules/backup/backup.{repository,service,controller}.ts` | Modified | Paginated findAll |
| `apps/api/src/modules/audit/dto/` | New | Pagination query DTO |
| `apps/api/src/modules/audit/audit.{repository,service,controller}.ts` | Modified | Paginated findAll |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Sidebar/Layout refactor touches every route | Medium | Progressive enhancement, visual review of every feature after PR 3 |
| Button rewrite affects every feature | Medium | Visual diff review per feature |
| Backend pagination contract change | High | Coordinate frontend hook updates in same PR cycle (PR 4 backend, PRs 5-6 frontend) |
| Bundle size +15-18KB from `motion` | Low | Acceptable, monitor in PR 1 |
| 8 features, copy-paste patterns | Medium | Shared primitives (pagination, filters, stat-card) introduced in Phase 2 |

## Rollback Plan

Each PR is independently revertible via `git revert`. If shared UI primitives break features: revert the specific PR, features continue using old components (no cross-PR hard dependencies). Backend pagination: old endpoints return full arrays; new paginated endpoints are additive until frontend switches over.

## Dependencies

- `pnpm --filter @vaultly-control/web add motion` (Phase 1)
- T1 vitest infrastructure already in place (commit `9601082`)
- No new backend dependencies beyond existing TypeORM/NestJS

## Success Criteria

- [ ] Smooth entrance animations on each feature (no jank, no `prefers-reduced-motion` violation)
- [ ] Sidebar active state: subtle highlight + hairline indicator (no side-stripe)
- [ ] Button press feedback: `scale(0.97)` on `:active`
- [ ] Stat cards: outline variant + BadgeDot trend (no tinted pills)
- [ ] Pagination on Audit and Dumps with real backend data
- [ ] Filters via Popover with active filter chips above table
- [ ] Dark-mode-ready token system (dark mode itself ships later)
- [ ] `prefers-reduced-motion` respected everywhere
- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` pass in all packages
