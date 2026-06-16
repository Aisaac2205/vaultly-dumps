# Spec: cronjobs-ui (delta)

> **Note**: This spec is **retroactive documentation** of PR #8 (`feat/ui-cronjobs`) which follows the spec-first discipline codified in commit `4176f63`. It serves as the contract for `sdd-verify` and as a reference for future changes touching the Cronjobs UI.

## Purpose

Cronjobs page (`apps/web/src/features/cronjobs/`). This delta documents the redesigned UI shipped in PR #8, which replaces custom components with design system primitives (`DataTable`, `Filters`, `Stagger`, `FadeIn`) from prior PRs.

## ADDED Requirements

### Requirement: Cronjobs List with Design Primitives

The Cronjobs page MUST render the list of scheduled jobs using the `DataTable` compound from PR 2b.

- The table uses `Column<Cronjob>[]` definitions with `accessor` functions.
- The "Activo" column renders a toggle switch with instant feedback (no enter/exit animation — toggles are keyboard-initiated actions used 100+ times/day per emil-design-eng).
- The "Acciones" column renders Edit/Delete buttons on desktop and a dropdown menu on mobile.
- The "Entorno" column shows the environment name as plain uppercase mono text (NOT a badge — per PR 3c4 user feedback).
- The loading state shows Skeleton cells matching column count and shape.
- The empty state is composed: `Clock` icon + "No hay cronjobs configurados" + helper text.

#### Scenario: Table renders rows with data
- **WHEN** cronjobs data is available
- **THEN** each row shows: Nombre, Conexión (with ConnectionLabel), Entorno (text, uppercase, no badge), Expresión Cron (mono, sm:hidden), Próxima Ejecución (mono, sm:hidden), Último Estado (with StatusBadge or em dash), Activo (toggle switch), Acciones
- **AND** the Entorno column shows the environment name from the connections context using `resolveEnv()`

#### Scenario: Unknown connection shows em dash
- **WHEN** a cronjob references a connection ID not in the connections store
- **THEN** the Entorno cell renders "—" (em dash) in `text-muted-foreground`

#### Scenario: Empty state with no cronjobs
- **WHEN** the cronjobs list is empty (no filters applied)
- **THEN** the table shows a composed empty state: `Clock` icon + headline "No hay cronjobs configurados" + helper text "Creá tu primer cronjob para programar respaldos automáticos."

#### Scenario: Loading state
- **WHEN** cronjobs are being fetched
- **THEN** the table renders skeleton rows matching the real column count
- **AND** the stat cards render skeleton variants

#### Scenario: Error state
- **WHEN** the API call fails (e.g., 500 error)
- **THEN** an `Alert` with `variant="destructive"` displays above the table
- **AND** the error message is displayed inline

### Requirement: Toggle Switch — Instant Feedback

The "Activo" column toggle MUST follow emil-design-eng principles for keyboard-initiated actions.

- The toggle renders instantly on click — NO enter/exit animation (no 200ms transition, no fade).
- The button MUST have `active:scale-[0.97]` for tactile press feedback.
- The button uses `role="switch"` and `aria-checked` for accessibility.
- The button is disabled with `disabled:cursor-not-allowed disabled:opacity-50` while toggling.
- Visual state: `ToggleRight` icon with `text-primary` when active; `ToggleLeft` icon when paused.

#### Scenario: Toggle from active to paused
- **WHEN** the user clicks the toggle on an active cronjob
- **THEN** the button scales to 0.97 on press (instant)
- **AND** the icon swaps from `ToggleRight` (primary) to `ToggleLeft` (muted) immediately
- **AND** the API call `POST /cronjobs/:id/toggle` is made
- **AND** on success, a Sonner toast says "Cronjob pausado"

#### Scenario: Toggle from paused to active
- **WHEN** the user clicks the toggle on a paused cronjob
- **THEN** the button scales to 0.97 on press (instant)
- **AND** the icon swaps from `ToggleLeft` to `ToggleRight` (primary) immediately
- **AND** on success, a Sonner toast says "Cronjob activado"

#### Scenario: Toggle during loading
- **WHEN** the toggle API call is in progress
- **THEN** the toggle button is disabled
- **AND** the cursor shows `not-allowed` and opacity is reduced
- **AND** no additional clicks are processed

### Requirement: Cronjob Filters

The Cronjobs page MUST use the `Filters` compound component from PR 2b for filter management.

- The filter state is managed by the `useCronjobFilters` hook (unchanged from original implementation).
- A conversion layer maps `CronjobFiltersState` ↔ `Record<string, string>` for `Filters.Root`.
- The filter popover includes: `Filters.Search` (by name or connection), `Filters.Select` (status), `Filters.Select` (active/paused).
- Active filters appear as removable chips via `Filters.ActiveChips`.
- Filter changes apply instantly (debounced 300ms for search, immediate for selects).

#### Scenario: Search by name
- **WHEN** the user types "Daily" in the search input
- **THEN** after 300ms debounce, the table filters to show only cronjobs whose name or connectionName includes "daily"
- **AND** an active chip appears: "search: Daily" with an X to remove

#### Scenario: Filter by status
- **WHEN** the user selects "Fallido" from the status dropdown
- **THEN** only cronjobs with `lastStatus === "failed"` are shown
- **AND** an active chip appears: "status: Fallido"

#### Scenario: Filter by active/paused
- **WHEN** the user selects "Activos" from the active dropdown
- **THEN** only cronjobs with `isActive === true` are shown
- **AND** an active chip appears: "active: Activos"

#### Scenario: Remove a filter chip
- **WHEN** the user clicks the X on an active chip
- **THEN** only that filter is removed
- **AND** the table re-renders with the remaining filters

### Requirement: Stats Cards with Motion

The Cronjobs page MUST show 4 stat cards above the table with staggered entry animation.

- Each card uses the `StatCard` component with `variant="outlined"` (NOT the `compact` prop).
- Cards are wrapped in `<Stagger>` and each card is a `<StaggerItem>`.
- The stagger animation uses `transform` and `opacity` only (hardware-accelerated, 220ms duration, 50ms stagger delay).
- Under `prefers-reduced-motion: reduce`, the stagger is bypassed and cards render statically.

#### Scenario: Stats render with data
- **WHEN** cronjobs data has loaded
- **THEN** four stat cards display: Total cronjobs, Activos, Estado principal (count + label), Próxima ejecución (value + unit)
- **AND** the cards enter with stagger animation

#### Scenario: Stats render with zero data
- **WHEN** there are no cronjobs
- **THEN** the stat cards show: 0, 0, "N/A", and a fallback for next run

### Requirement: Page-Level Animation

The Cronjobs page MUST use `FadeIn` wrapper for page-level entry animation.

- The main content wrapper uses `<FadeIn className="space-y-8 p-4 sm:p-6 lg:p-8">`.
- This replaces the previous `p-8` padding with responsive padding.
- The `FadeIn` component honors `prefers-reduced-motion`.

#### Scenario: Page loads with animation
- **WHEN** the Cronjobs page mounts
- **THEN** the entire page content fades in with an 8px vertical offset (220ms duration, ease-out)

### Requirement: Cronjob Creation and Editing

The Cronjobs page MUST support creating and editing cronjobs via the `CronjobForm` component (unchanged from original).

- Clicking "Nuevo cronjob" opens the CronjobForm with empty fields.
- Clicking "Editar" on a row opens the CronjobForm pre-filled with the cronjob's data.
- Form submission calls the appropriate mutation (create or update).
- On success, a Sonner toast appears and the form closes.

#### Scenario: Create a new cronjob
- **WHEN** the user fills the form and submits
- **THEN** `POST /cronjobs` is called with the DTO
- **AND** on success, toast "Cronjob creado correctamente" appears
- **AND** the form closes and the list refetches

#### Scenario: Edit an existing cronjob
- **WHEN** the user clicks "Editar" on a row
- **THEN** the form opens pre-filled with the cronjob's data
- **AND** on submit, `PATCH /cronjobs/:id` is called
- **AND** on success, toast "Cronjob actualizado correctamente" appears

## Cross-App Contract Reference

This spec consumes the following cross-app contract with the `jobs` module API:

- `GET /cronjobs` returns `Cronjob[]`:
  ```typescript
  {
    id: string;
    name: string;
    connectionId: string;
    connectionName?: string;
    cronExpression: string;
    frequency: CronFrequency;
    isActive: boolean;
    lastRunAt?: string;
    nextRunAt?: string;
    lastStatus?: JobStatus;
    retentionEnabled?: boolean;
    retentionKeepLast?: number;
    retentionMaxAgeDays?: number;
    retentionMaxSizeMb?: number;
  }
  ```
- `POST /cronjobs` creates a new cronjob (body: `CreateCronjobDto`)
- `PATCH /cronjobs/:id` updates a cronjob (body: `UpdateCronjobDto`)
- `DELETE /cronjobs/:id` deletes a cronjob
- `POST /cronjobs/:id/toggle` toggles the active/paused state
- `GET /connections?environment=prod` returns `Connection[]` for the form's connection selector

If the backend contract changes, this spec must be updated FIRST.

## Status Indicator Pattern

The "Último Estado" column uses the `StatusBadge` component from the shared UI:

| Status    | Visual                               |
|-----------|--------------------------------------|
| pending   | Badge with muted tone, "Pendiente"   |
| running   | Badge with info tone, "En progreso"  |
| completed | Badge with success tone, "Completado"|
| failed    | Badge with destructive tone, "Fallido"|
| undefined | Em dash "—" in mono text             |

## Toggle / Switch Motion Pattern

Per emil-design-eng animation decision framework:

| Factor                  | Decision                              |
|-------------------------|---------------------------------------|
| Frequency               | 100+ times/day (keyboard-initiated)   |
| Animation               | No enter/exit animation               |
| Press feedback          | `active:scale-[0.97]` (160ms ease-out)|
| Knob movement           | `transition-transform` only           |
| Disabled state          | `opacity-50 cursor-not-allowed`       |

The toggle is NOT a decorative component — it is a per-row control that users toggle frequently during batch operations. Animating it would feel sluggish. The only allowed transition is `transform` on press (tactile feedback).

## Deviations from Original tasks.md

The PR #8 implementation shipped with these deviations from the original `tasks.md` estimate:

1. **No manual trigger column** — The Cronjobs page does not expose a "manual trigger" button. The `POST /cronjobs/:id/toggle` endpoint only handles enable/disable. Manual trigger is a future feature.
2. **No run history table** — The Cronjobs page shows only the current state, not a historical run log. Run history is out of scope for this PR.

## Out of Scope (deferred to other PRs)

- Manual trigger (run once) button — requires a new API endpoint
- Run history list — requires a new endpoint or embedding in the cronjob response
- Bulk actions (bulk enable, bulk delete)
- Cron expression visual builder
- Real-time status updates (websocket) — current behavior uses `refetchInterval: 30_000`
