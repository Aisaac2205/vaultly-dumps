# Design: UI/UX Overhaul

## 1. Architecture Overview

The overhaul introduces a layered design system: **tokens** (CSS custom properties in `@theme {}`) → **primitives** (`button`, `card`, `stat-card`, `dialog`, `sheet`, `popover`, `data-table`, `pagination`, `filters`, motion helpers) → **compounds** (stat-card + badge-dot, data-table + pagination + filters) → **features** (each of the 9 feature pages adopting new primitives). The motion system uses `motion/react` for overlay enter/exit animations (dialog, sheet) and list reveals (FadeIn, Stagger), while CSS transitions handle lightweight interactions (button press, card hover). All motion is gated by `useReducedMotion()` from `motion/react`.

The pagination contract flows: backend DTO (`ListHistoryQueryDto` / `ListAuditLogsQueryDto`) validated by `class-validator` → repository `findAll({ page, pageSize, ...filters })` using TypeORM `getManyAndCount()` → service maps to `PaginatedResponseDto<T>` → controller returns `GET /backups/history?page=1&pageSize=25` → frontend TanStack Query hook fetches and caches → `<Pagination>` component renders with Spanish labels, prefetch-on-hover, and page-size selector.

Token changes are backward-compatible: new variables are additive; existing `--color-sidebar` values are kept with minor adjustments. Dark-mode slots are defined as `[data-theme="dark"]` blocks with values but not wired into components — that ships later.

## 2. Token System

```css
@theme {
  /* ── Existing (kept, minor adjustments noted) ── */
  --color-sidebar: #2B2B2B;
  --color-sidebar-text: #FFFFFF;
  --color-sidebar-hover: rgba(255, 255, 255, 0.08);
  --color-sidebar-active: rgba(255, 255, 255, 0.12);   /* was 0.15 */
  --color-sidebar-border: rgba(255, 255, 255, 0.10);     /* NEW */
  --color-sidebar-indicator: var(--color-accent);         /* NEW — hairline accent */

  /* ── Accent ── */
  --color-accent: #2563EB;
  --color-accent-hover: #1E5B93;           /* 10% darker */
  --color-accent-soft: rgba(37, 99, 235, 0.08);
  --color-accent-foreground: #FFFFFF;

  /* ── Existing colors (unchanged) ── */
  --color-bg: #F7F7F7;
  --color-bg-subtle: #F7F7F7;
  --color-background: #FFFFFF;
  --color-text-primary: #2B2B2B;
  --color-text-secondary: #6B6B6B;
  --color-border: #E5E5E5;
  --color-success: #22C55E;
  --color-success-bg: #F0FDF4;
  --color-info: #3B82F6;
  --color-info-bg: #EFF6FF;
  --color-warning: #EAB308;
  --color-warning-bg: #FEFCE8;
  --color-error: #EF4444;
  --color-error-bg: #FEF2F2;
  --color-popover: #FFFFFF;
  --color-popover-foreground: #2B2B2B;
  --color-card: #FFFFFF;
  --color-card-foreground: #2B2B2B;
  --color-accent: #2563EB;                /* overrides shadcn gray */
  --color-accent-foreground: #FFFFFF;     /* overrides shadcn gray */
  --color-muted: #F5F5F5;
  --color-muted-foreground: #737373;
  --color-destructive: #EF4444;
  --color-destructive-foreground: #FFFFFF;
  --color-ring: #2563EB;                  /* was #2B2B2B → accent for focus rings */
  --color-input: #E5E5E5;
  --font-sans: "Geist Variable", system-ui, sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, monospace;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* ── Easing ── */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

  /* ── Duration ── */
  --duration-fast: 160ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}

/* ── Dark mode slots (no component wiring — ships later) ── */
[data-theme="dark"] {
  --color-sidebar: #1A1A1A;
  --color-sidebar-text: #E5E5E5;
  --color-sidebar-hover: rgba(255, 255, 255, 0.06);
  --color-sidebar-active: rgba(255, 255, 255, 0.10);
  --color-sidebar-border: rgba(255, 255, 255, 0.08);
  --color-accent: #3B82F6;
  --color-accent-hover: #2563EB;
  --color-accent-soft: rgba(59, 130, 246, 0.12);
  --color-bg: #0A0A0A;
  --color-bg-subtle: #111111;
  --color-background: #141414;
  --color-text-primary: #E5E5E5;
  --color-text-secondary: #A3A3A3;
  --color-border: #262626;
  --color-card: #141414;
  --color-card-foreground: #E5E5E5;
  --color-popover: #141414;
  --color-popover-foreground: #E5E5E5;
  --color-muted: #1C1C1C;
  --color-muted-foreground: #A3A3A3;
}
```

## 3. File-Level Diff Plan

### Phase 1 — Foundation

| File | Action | Description |
|------|--------|-------------|
| `apps/web/package.json` | MODIFY | Add `motion` dependency |
| `apps/web/src/shared/styles/globals.css` | MODIFY | Add accent tokens, easing/duration tokens, sidebar tokens, dark-mode slots |
| `apps/web/src/shared/ui/motion/FadeIn.tsx` | NEW | `<FadeIn>` entrance animation component |
| `apps/web/src/shared/ui/motion/Stagger.tsx` | NEW | `<Stagger>` list reveal component |
| `apps/web/src/shared/ui/motion/PressFeedback.tsx` | NEW | `<PressFeedback>` press scale component |

**New component signatures:**

```tsx
// FadeIn.tsx
interface FadeInProps {
  children: React.ReactNode;
  duration?: number;    // default 220ms
  delay?: number;       // default 0
  className?: string;
  as?: React.ElementType; // default 'div'
}
// Reduced motion: renders children with no animation.

// Stagger.tsx
interface StaggerProps {
  children: React.ReactNode;
  staggerDelay?: number; // default 50ms
  className?: string;
  as?: React.ElementType; // default 'div'
}
// Reduced motion: renders children instantly with no stagger.

// PressFeedback.tsx
interface PressFeedbackProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType; // default 'div'
}
// Reduced motion: no scale on press.
```

### Phase 2 — Shared UI Primitives

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/shared/ui/button.tsx` | MODIFY | Add `:active` scale(0.97) + transform transition |
| `apps/web/src/shared/ui/card.tsx` | MODIFY | Add CVA variants: `elevated`, `outlined`, `subtle`; change default from `rounded-xl` to `rounded-lg` |
| `apps/web/src/shared/ui/stat-card.tsx` | MODIFY | Use `variant="outlined"`, replace tinted pill with `<BadgeDot>`, remove muted icon opacity |
| `apps/web/src/shared/ui/badge.tsx` | MODIFY | Ensure `outline` variant and `BadgeDot` are exported/stable |
| `apps/web/src/shared/ui/dialog.tsx` | MODIFY | Replace Tailwind animate classes with motion/react variants |
| `apps/web/src/shared/ui/sheet.tsx` | MODIFY | Replace slide animation with motion/react variants, add `aria-describedby={undefined}` (already present — keep), keep `transform-origin: center` |
| `apps/web/src/shared/ui/popover.tsx` | MODIFY | Keep Radix origin transform, update easing to `var(--ease-out-strong)` |
| `apps/web/src/shared/ui/data-table.tsx` | MODIFY | Remove `sm:table-fixed`, add `<DataTableFooter>` slot for pagination, add `truncate` on headers, add `@starting-style` skeleton→data transition |
| `apps/web/src/shared/ui/pagination.tsx` | NEW | `<Pagination>` component |
| `apps/web/src/shared/ui/filters.tsx` | NEW | `<Filters>` compound component |

**New component signatures:**

```tsx
// pagination.tsx
interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  labels?: {
    previous?: string; // default "Anterior"
    next?: string;      // default "Siguiente"
    showing?: string;   // default "Mostrando {from}-{to} de {total}"
  };
  pageSizeOptions?: number[]; // default [10, 25, 50, 100]
}
// Reduced motion: instant transitions, no hover prefetch animation.

// filters.tsx
interface FilterConfig {
  key: string;
  label: string;
  type: 'search' | 'select' | 'dateRange';
  options?: { value: string; label: string }[];
}

// Filters.Root provides context.
// Filters.Trigger — opens popover, shows badge count.
// Filters.Popover — Radix Popover container.
// Filters.Search — instant mode, 300ms debounce.
// Filters.Select — submit mode, Radix Select.
// Filters.DateRange — submit mode, date inputs.
// Filters.ActiveChips — Badge variant="outline" + BadgeDot above table.
// Filters.Apply — submit button for submit-mode filters.
// Reduced motion: popover/chip animations are instant.
```

### Phase 3 — Layout & Navigation Shell

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/shared/components/Sidebar.tsx` | MODIFY | Replace `border-r-2 border-white bg-white/10` with `bg-sidebar-active` + left hairline accent; replace `bg-black` with `bg-sidebar`; convert className to `cn()` |
| `apps/web/src/shared/components/Layout.tsx` | MODIFY | Add `<Topbar>` component (56px, breadcrumbs left, user menu right, dark-mode toggle slot, hidden < md); wrap `<main>` in `motion.main` with `AnimatePresence`; replace mobile header `bg-black` with `bg-sidebar` |

### Phase 4 — Pagination Backend

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/modules/backup/dto/list-history-query.dto.ts` | NEW | `ListHistoryQueryDto` with `page`, `pageSize` |
| `apps/api/src/modules/backup/dto/index.ts` | MODIFY | Export new DTO |
| `apps/api/src/common/dto/paginated-response.dto.ts` | NEW | Generic `PaginatedResponseDto<T>` wrapper |
| `apps/api/src/modules/backup/backup.repository.ts` | MODIFY | Update `findAll` to accept `{ page?, pageSize? }`, use `getManyAndCount()` |
| `apps/api/src/modules/backup/backup.service.ts` | MODIFY | Update `getHistory()` to accept pagination, map to `PaginatedResponseDto` |
| `apps/api/src/modules/backup/backup.controller.ts` | MODIFY | `getHistory()` accepts `@Query() ListHistoryQueryDto` |
| `apps/api/src/modules/audit/dto/list-audit-logs-query.dto.ts` | NEW | `ListAuditLogsQueryDto` (merged `AuditFilters` + `page`, `pageSize`) |
| `apps/api/src/modules/audit/dto/index.ts` | NEW | Barrel export |
| `apps/api/src/modules/audit/audit.repository.ts` | MODIFY | Update `findAll` to accept `{ page?, pageSize? }` alongside `filters`, use `getManyAndCount()` |
| `apps/api/src/modules/audit/audit.service.ts` | MODIFY | Update `getLogs()` to accept pagination, map to `PaginatedResponseDto` |
| `apps/api/src/modules/audit/audit.controller.ts` | MODIFY | Replace `AuditFilters` import with `ListAuditLogsQueryDto`, add validation pipe |

### Phase 5 — Features (8 PRs)

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/features/audit/hooks/useAudit.ts` | MODIFY | Replace client-side slicing with TanStack Query + pagination params |
| `apps/web/src/features/audit/types.ts` | MODIFY | Update `AuditLog` fetch type to `PaginatedResponse<AuditLog>` |
| `apps/web/src/features/dumps/hooks/useDumps.ts` | MODIFY | Replace client-side filtering+pagination with server-side pagination |
| `apps/web/src/features/*/pages/*.tsx` (8 features) | MODIFY | Adopt `<FadeIn>`, `<Stagger>`, `<Pagination>`, `<Filters>` as applicable |
| `apps/web/src/features/login/pages/*.tsx` | MODIFY | Polish — motion entrance on login card |

### Phase 13 — Motion Pass

| File | Action | Description |
|------|--------|-------------|
| `apps/web/src/shared/components/Layout.tsx` | MODIFY | Add `AnimatePresence` + `motion.main` for page transitions |

## 4. Library & API Decisions

| Decision | Choice | Rationale |
|----------|-------|-----------|
| Motion library | `motion` (framer-motion v11+) via `pnpm --filter @vaultly-control/web add motion` | 15-18KB gz, React 19 native, tree-shakeable, interruptible via `AnimatePresence` |
| Backend validation | `class-validator` + `class-transformer` (already installed) | No new dependencies |
| Form library | Keep react-hook-form pattern (no migration) | Current pattern works, no scope creep |
| Router | Keep React Router 7 SPA pattern (no data router migration) | Out of scope per proposal |
| Backend response wrapper | `PaginatedResponseDto<T>` in `apps/api/src/common/dto/` | Single generic wrapper for all paginated endpoints |
| Focus ring color | `--color-ring: #2563EB` (accent) | Replaces shadcn gray ring; matches accent across all components |

## 5. Animation Strategy

### Buttons
CSS only — no JS. Append to existing `transition-colors`:
```css
transition: transform var(--duration-fast) var(--ease-out-strong),
            color var(--duration-fast) ease-out,
            background-color var(--duration-fast) ease-out;
:active { transform: scale(0.97); }
```
At `prefers-reduced-motion: reduce`: `transition: none; :active { transform: none; }`.

### Card Hover
CSS: `transition: transform 200ms var(--ease-out-strong), box-shadow 200ms var(--ease-out-strong); hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }`.

### Dialog / Sheet
**motion/react variants** for entry/exit. These overlays need interruptibility for ESC and click-outside dismissal — CSS animations cannot be interrupted mid-flight.

```tsx
const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const contentVariants = {
  initial: { opacity: 0, scale: 0.95, transformOrigin: 'center' },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } },
};
```

Sheet overlay + content use the same variants. The side-slide animation is replaced by the scale+fade approach (spec requirement). `aria-describedby={undefined}` is already present in sheet — keep it.

### Popover
Keep Radix's CSS `--radix-popover-content-transform-origin` for origin-aware transforms. Update easing to `var(--ease-out-strong)` by custom CSS class. No motion/react — popover animations are short enough that CSS suffices and Radix manages them well.

### Page Transitions
`AnimatePresence` wrapping `<motion.main>` in `Layout.tsx`:
```tsx
<AnimatePresence mode="wait">
  <motion.main
    key={location.pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, transition: { duration: 0.15 } }}
    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
  >
    {children}
  </motion.main>
</AnimatePresence>
```

### List Stagger
```tsx
const staggerParent = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const staggerChild = {
  initial: { opacity: 0, translateY: 8 },
  animate: { opacity: 1, translateY: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};
```

All motion gated by `useReducedMotion()` from `motion/react`.

## 6. Component Composition

### `<Pagination>`
```tsx
interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  labels?: { previous?: string; next?: string; showing?: string };
  pageSizeOptions?: number[];
}
// Usage:
<Pagination page={1} pageSize={25} total={234} onPageChange={setPage} onPageSizeChange={setSize} />
// Reduced motion: instant transitions, prefetch still works (prefetch is network, not animation).
```

### `<Filters.Root>`
```tsx
interface FiltersRootProps<T extends Record<string, unknown>> {
  filters: T;
  onFiltersChange: (filters: T) => void;
  children: React.ReactNode;
}
```
Sub-components: `Filters.Trigger`, `Filters.Popover`, `Filters.Search`, `Filters.Select`, `Filters.DateRange`, `Filters.ActiveChips`, `Filters.Apply`. All composed via context.

```tsx
<Filters.Root filters={filters} onFiltersChange={setFilters}>
  <div className="flex items-center gap-2">
    <Filters.Trigger />
    <Filters.ActiveChips />
  </div>
  <Filters.Popover>
    <Filters.Search filterKey="q" />
    <Filters.Select filterKey="status" options={statusOptions} />
    <Filters.Apply />
  </Filters.Popover>
</Filters.Root>
// Reduced motion: popover/chip animations are instant.
```

### `<FadeIn>`
```tsx
interface FadeInProps {
  children: React.ReactNode;
  duration?: number;   // default 220ms
  delay?: number;     // default 0
  className?: string;
  as?: React.ElementType;
}
// Usage: <FadeIn><Card>...</Card></FadeIn>
// Reduced motion: renders children with no animation (opacity: 1, translateY: 0).
```

### `<Stagger>`
```tsx
interface StaggerProps {
  children: React.ReactNode;
  staggerDelay?: number; // default 50ms
  className?: string;
  as?: React.ElementType;
}
// Usage: <Stagger>{items.map(i => <FadeIn key={i.id}><Card /></FadeIn>)}</Stagger>
// Reduced motion: renders children instantly with no stagger.
```

### `<PressFeedback>`
```tsx
interface PressFeedbackProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}
// Usage: <PressFeedback><Button>Click</Button></PressFeedback>
// Reduced motion: no scale animation on press.
```

## 7. Backend Pagination Contract

### `ListHistoryQueryDto`
```ts
// apps/api/src/modules/backup/dto/list-history-query.dto.ts
import { IsOptional, IsInt, Min, Max, Type } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 25;
}
```

### `ListAuditLogsQueryDto`
```ts
// apps/api/src/modules/audit/dto/list-audit-logs-query.dto.ts
import { IsOptional, IsInt, Min, Max, IsString, IsEnum, IsDateString, Type } from 'class-validator';
import { Environment } from '../../../database/enums/environment.enum';

export class ListAuditLogsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number = 25;

  @IsOptional() @IsString()
  userId?: string;

  @IsOptional() @IsString()
  username?: string;

  @IsOptional() @IsEnum(Environment)
  environment?: Environment;

  @IsOptional() @IsString()
  resourceType?: string;

  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;
}
```
**Decision**: MERGE. `AuditFilters` is currently an exported interface from `audit.repository.ts` with no validation. The `ListAuditLogsQueryDto` consolidates all query parameters (pagination + filters) into one validated DTO. This eliminates the manual `parseFilters` method in the controller and the inline `AuditFilters` interface. The DTO is the single source of truth for what `GET /audit` accepts. Backward compatibility: `findAll()` with no pagination args still works for non-list endpoints.

### `PaginatedResponseDto<T>`
```ts
// apps/api/src/common/dto/paginated-response.dto.ts
export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Repository Changes

**Backup**: `findAll()` gains optional pagination:
```ts
async findAll(options?: { page?: number; pageSize?: number }): Promise<{ data: BackupJobEntity[]; total: number }> {
  if (options?.page && options?.pageSize) {
    const [data, total] = await this.repository.findAndCount({
      order: { createdAt: 'DESC' },
      take: options.pageSize,
      skip: (options.page - 1) * options.pageSize,
    });
    return { data, total };
  }
  const data = await this.repository.find({ order: { createdAt: 'DESC' } });
  return { data, total: data.length };
}
```

**Audit**: `findAll(filters?, pagination?)` — same pattern with `findAndCount({ where, order, take, skip })`.

### Controller

```ts
// backup.controller.ts
@Get('history')
getHistory(@Query() query: ListHistoryQueryDto) {
  return this.service.getHistory(query);
}

// audit.controller.ts — replaces AuditFilters import
@Get()
getLogs(@Query() query: ListAuditLogsQueryDto) {
  return this.service.getLogs(query);
}
```

## 8. Test Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `<Button>` press feedback renders, `:active` class | `render()`, `screen.getByRole('button')`, `fireEvent.click()` |
| Unit | `<Card>` variants render correct classes | Parameterized test per variant (`elevated`, `outlined`, `subtle`) |
| Unit | `<Pagination>` renders range, disables on empty | `render()`, `screen.getByRole()`, `screen.getByText('Mostrando')` |
| Unit | `<Filters.Root>` context provides filter state | Render with `Filters.Trigger`, verify badge count |
| Unit | `<FadeIn>`, `<Stagger>`, `<PressFeedback>` | `useReducedMotion` mock returns `true` → no animation classes |
| Unit | `ListHistoryQueryDto` validation | Instantiate with valid/invalid params, run `validate()` |
| Unit | `ListAuditLogsQueryDto` validation | Same pattern |
| Unit | `PaginatedResponseDto` mapping | Verify `{ data, total, page, pageSize }` shape |
| Integration | `BackupRepository.findAll({ page, pageSize })` | `findAndCount()` returns correct slice |
| Integration | `AuditRepository.findAll(filters, { page, pageSize })` | `findAndCount()` with where clause + pagination |
| E2E | `GET /backups/history?page=1&pageSize=25` | Returns paginated response shape |
| E2E | `GET /audit?page=1&pageSize=25&environment=prod` | Returns filtered paginated response |

**Testing patterns (from T1 `button.test.tsx`):**
- Use `screen.getByRole()` for accessibility-first queries (never `getByTestId`)
- Type handlers as `Mock<...>` — never `any`
- Use `@testing-library/react` render + fireEvent
- Reduced-motion tests: mock `useReducedMotion` from `motion/react` to return `true`, assert no transform/transition
- Test command: `pnpm --filter @vaultly-control/web test`

## 9. Browser Support Target

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 117+ | `@starting-style` supported |
| Edge | 117+ | `@starting-style` supported |
| Safari | 17.4+ | `@starting-style` supported |
| Firefox | current | No `@starting-style`; **fallback: skip skeleton→data animation, use simple opacity transition** |

`@starting-style` is used only for skeleton→data table transition (non-critical visual polish). Firefox fallback is a simple `opacity: 0 → 1` transition on data load. No `@starting-style` dependency for critical functionality.

## 10. Risk Mitigations

### 1. Audit DTO Merge Decision
**Decision**: MERGE `AuditFilters` into `ListAuditLogsQueryDto`.
**Justification**: The current `AuditFilters` interface is an unvalidated inline type exported from `audit.repository.ts`. The controller has a manual `parseFilters()` method that duplicates validation logic. Merging into a single `class-validator` DTO eliminates: (a) the untyped `AuditFilters` interface, (b) the manual `parseFilters()` method, (c) the mismatch between what the controller accepts and what the repository expects. The DTO becomes the single source of truth for `GET /audit` query params. The `findAll` method signature changes from `findAll(filters?: AuditFilters)` to `findAll(filters?: PaginationFilters)` where `PaginationFilters` is derived from the DTO. Backward compatibility is preserved: `findAll()` with no args still returns all rows for non-list contexts.

### 2. Dialog/Sheet Animation Strategy
**Decision**: motion/react variants for dialog and sheet entry/exit.
**Justification**: Dialogs and sheets are high-interaction overlays. Users may dismiss them mid-animation (ESC key, click-outside). `AnimatePresence` from `motion/react` supports interruptible exit animations — CSS `@keyframes` do not. The scale+fade variant (`scale(0.95) → 1, opacity(0) → 1`) is spec-compliant and feels polished. For popover, CSS suffices because the animation is short and Radix manages `transform-origin` — no motion/react needed there.

### 3. `@starting-style` Browser Support
**Decision**: Accept Chrome 117+, Edge 117+, Safari 17.4+. Firefox gets fallback.
**Justification**: vaultly-control is an internal admin tool for technical users. Current Chrome/Edge/Safari/Firefox is the realistic floor. `@starting-style` is used only for the skeleton→data transition in `DataTable`, which is a visual polish, not functional. Firefox fallback: simple `opacity` transition on `.data-loaded` class toggle — no `@starting-style`.

### 4. Sidebar Token Values
**Decision**: KEEP existing `--color-sidebar: #2B2B2B` and `--color-sidebar-text: #FFFFFF`. UPDATE `--color-sidebar-active` from `rgba(255,255,255,0.15)` to `rgba(255,255,255,0.12)`. ADD `--color-sidebar-border` and `--color-sidebar-indicator`.
**Justification**: The existing sidebar tokens are sensible enterprise dark-sidebar values. The 0.15→0.12 adjustment produces a subtler active highlight aligned with the "subtle surface highlight" design intent. The new `--color-sidebar-indicator: var(--color-accent)` links the hairline to the accent color, maintaining consistency.

### Proposal-Level Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Sidebar/Layout refactor touches every route | Progressive enhancement in Phase 3 — visual review per feature after PR 3 |
| Button rewrite affects every feature | `transition-colors` stays, only `transform` is added — no visual regression for resting state |
| Backend pagination contract change | Backend PR 4 ships first, frontend PRs 5-6 consume it — no breaking change during rollout |
| Bundle size +15-18KB from `motion` | Acceptable for admin tool; monitor in Phase 1 |
| Copy-paste patterns across features | Shared primitives (Pagination, Filters, FadeIn, Stagger, PressFeedback) introduced in Phase 2 before feature adoption |

## 11. Implementation Order

Strict chained PR sequence (no parallelization — each depends on the prior):

```
PR 1:  Foundation (tokens + motion dependency + easing/duration vars)
  │
  ├─→ PR 2a: Shared UI buttons/card/stat-card/badge/token changes
  │      │
  │      └─→ PR 2b: Dialog/sheet/popover/data-table/pagination/filters/motion primitives
  │             │
  │             └─→ PR 3: Sidebar + Layout + Topbar (shell)
  │                    │
  │                    └─→ PR 4: Backend pagination (DTOs + repos + services + controllers)
  │                           │
  │                           ├─→ PR 5:  Audit feature adoption
  │                           ├─→ PR 6:  Dumps feature adoption
  │                           ├─→ PR 7:  Dashboard adoption
  │                           ├─→ PR 8:  Cleanup adoption
  │                           ├─→ PR 9:  Restore adoption
  │                           ├─→ PR 10: Cronjobs adoption
  │                           ├─→ PR 11: Connections adoption
  │                           ├─→ PR 12: Users adoption
  │                           └─→ PR 13: Motion pass (page transitions + login polish)
```

PRs 5-12 can be parallelized by different developers but must all target PR 4 as base. PR 13 is the final polish pass and depends on all features being adopted.

**If PR 2 exceeds 400 lines**: Split into PR 2a (button.tsx, card.tsx, stat-card.tsx, badge.tsx, globals.css token additions) and PR 2b (dialog.tsx, sheet.tsx, popover.tsx, data-table.tsx, pagination.tsx, filters.tsx, motion/).

## 12. Out of Scope

- Full dark mode implementation (tokens with slots ship now, component wiring deferred)
- Mobile-app native considerations
- New backend features beyond pagination
- React Router data router migration
- Form library migration (react-hook-form)
- i18n beyond Spanish (single-locale stays)
- Animation library swap (`motion` is locked)