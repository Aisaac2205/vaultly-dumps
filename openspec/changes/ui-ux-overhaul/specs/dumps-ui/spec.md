# Spec: dumps-ui (delta)

> **Note**: This spec is **retroactive documentation** of PR #5 (`feat/ui-dumps`) which was implemented before the spec-first discipline was codified (commit `4176f63` on integration, "codify UI/UX design skills as mandatory for web work"). Future PRs (audit-ui, connections-ui, etc.) will follow a strict spec-first workflow where this spec is written BEFORE implementation. This retroactive spec serves as the contract for `sdd-verify` and as a reference for future changes touching the Dumps UI.

## Purpose

Dumps page (`apps/web/src/features/dumps/`). This delta documents the server-side pagination, refactored hook, and redesigned UI shipped in PR #5.

## ADDED Requirements

### Requirement: Paginated Dumps List

The Dumps page MUST display backup history as a paginated list driven by server-side state.

- The page uses the `useDumps({ page, pageSize, filters })` hook (PR #5 rewrite).
- The hook calls `GET /backups/history?page=N&pageSize=M&...filters` which returns `PaginatedResponse<BackupJob>` (the contract established in PR #4 `backup-api` spec).
- Page state lives in the page component (`useState` for `page` and `pageSize`).
- The `Pagination` compound from PR 2b renders the controls, with Spanish labels: "Mostrando X–Y de Z", "Anterior", "Siguiente".

#### Scenario: First page request
- **WHEN** the user opens the Dumps page with no filter applied
- **THEN** the page requests `GET /backups/history?page=1&pageSize=25`
- **AND** renders the 25 most recent dumps (ordered by `createdAt` DESC)

#### Scenario: Navigate to next page
- **WHEN** the user clicks the "Siguiente" pagination button
- **THEN** the page state updates to `page + 1`
- **AND** a new request is made with the new page number
- **AND** the table scrolls to the top

#### Scenario: Filter change resets to page 1
- **WHEN** the user applies any filter (connection, environment, status, from, to)
- **THEN** the page state resets to `page = 1`
- **AND** the table re-renders with the filtered results from page 1

### Requirement: Filters Compound Component

The Dumps page MUST use the `Filters` compound component from PR 2b for filter management.

- Filter popover opens with the active filter values pre-filled.
- Active filters appear as removable chips above the table.
- "Limpiar" (clear) button removes all active filters and resets the page to 1.
- Filter changes apply instantly (no "Aplicar" button — instant mode).

#### Scenario: Apply a single filter
- **WHEN** the user selects an environment (e.g. "PROD") from the filter popover
- **THEN** the popover closes
- **AND** a chip "Entorno: PROD" appears above the table
- **AND** the table re-renders with only PROD dumps

#### Scenario: Apply multiple filters
- **WHEN** the user selects connection "acme-prod" AND environment "PROD" AND status "FAILED"
- **THEN** three chips appear above the table
- **AND** the table shows only dumps matching ALL three conditions (AND, not OR)

#### Scenario: Remove a single filter chip
- **WHEN** the user clicks the X on a chip
- **THEN** only that filter is removed
- **AND** the table re-renders with the remaining filters applied

#### Scenario: Clear all filters
- **WHEN** the user clicks "Limpiar"
- **THEN** all chips disappear
- **AND** the page resets to 1
- **AND** the table shows the unfiltered first page

### Requirement: Stats Cards

The Dumps page MUST show 4 stat cards above the table (DumpsStats component).

- Each card uses the `StatCard` outlined variant from PR 2a.
- Cards are wrapped in a `Stagger` container from PR 1 (entry animation).
- Currently, the cards display aggregate counts only (no time-series data). The `Sparkline` and `TrendIndicator` primitives from PR 3c3 are NOT used here because the dumps API does not yet return time-series data; they will be adopted on Dashboard (PR #10) where the data source supports it.

#### Scenario: Stats render with data
- **WHEN** the dumps data has loaded
- **THEN** four stat cards display: Total, Exitosos, Fallidos, En progreso
- **AND** the cards enter with a stagger animation (transform + opacity only, 200ms each, 50ms stagger)

#### Scenario: Stats render with zero data
- **WHEN** the user has filters that match no dumps
- **THEN** all four stat cards show "0"
- **AND** the table shows the empty state

### Requirement: Dumps Table

The Dumps page MUST render dumps in a `DataTable` from PR 2b.

- The table includes an "Entorno" column (per the PR 3c4 pattern).
- Pagination slot is wired to the `Pagination` compound.
- Loading state shows skeletons matching the row shape (no generic spinners).
- Empty state is composed, not generic "No data".

#### Scenario: Table renders rows
- **WHEN** dumps data is available
- **THEN** each row shows: connection, database, status, Entorno (text column), createdAt, actions
- **AND** the Entorno column shows the environment name in plain uppercase mono text (NOT a badge — per PR 3c4 user feedback)

#### Scenario: Empty state
- **WHEN** the dumps list is empty after a filter
- **THEN** the table shows a composed empty state: icon + headline "No hay dumps que coincidan con los filtros" + helper text "Ajustá los filtros o limpia la búsqueda"

#### Scenario: Loading state
- **WHEN** dumps are being fetched
- **THEN** the table renders skeleton rows (matching the real row shape)
- **AND** the stat cards render skeleton variants

#### Scenario: Error state
- **WHEN** the API call fails (e.g. 500 error)
- **THEN** an `Alert` with `variant="destructive"` displays above the table
- **AND** a retry mechanism is available

### Requirement: Backup Creation Action

The Dumps page MUST allow triggering a new backup from a PROD connection.

- A connection selector (only PROD connections) and "Nuevo backup" button sit in the page header.
- Clicking "Nuevo backup" shows a `window.confirm` dialog.
- On confirm: `dumpsApi.triggerBackup(connectionId)` is called.
- On success: a Sonner toast displays "Backup creado correctamente" and the list refetches.
- On error: a destructive toast displays the error message and a destructive Alert shows inline.

#### Scenario: Successful backup creation
- **WHEN** the user selects a connection and confirms
- **THEN** the API call is made
- **AND** a success toast appears
- **AND** the dumps list refetches (page stays at current value)

#### Scenario: Failed backup creation
- **WHEN** the API call fails (e.g. connection not reachable)
- **THEN** a destructive toast appears with the error message
- **AND** the destructive Alert shows inline below the page header

## Cross-App Contract Reference

This spec consumes the following cross-app contract established in `backup-api/spec.md` (PR #4):

- `GET /backups/history?page=N&pageSize=M&...filters` returns `PaginatedResponse<BackupJob>`:
  ```typescript
  {
    data: BackupJob[];
    total: number;
    page: number;
    pageSize: number;
  }
  ```

If the backend contract changes, this spec must be updated FIRST (and the change propagated to the delta spec in `backup-api/spec.md`).

## Out of Scope (deferred to other PRs)

- Time-series stats with `Sparkline` / `TrendIndicator` — deferred to PR #10 (Dashboard) which has the data source.
- Server-side date range picker UX — current implementation uses native `<input type="date">`. Defer to a future "filters UX polish" PR.
- Bulk actions (select multiple dumps, bulk delete, bulk export) — out of scope for ui-ux-overhaul.
- Real-time updates (websocket) — out of scope; current behavior is refetch-on-action and staleTime: 30s.

## Deviations from Original tasks.md

The PR #5 implementation shipped with these deviations from the original `tasks.md` estimate:

1. **No Sparkline/TrendIndicator in DumpsStats** — the data source does not support time-series (see "Out of Scope").
2. **Filter UX uses instant mode** (no "Aplicar" button) — the task said "adopt Filters compound", and the compound's instant mode is the more responsive pattern. Submit mode was rejected as backwards.

These deviations are documented here so future PRs touching Dumps UI do not re-litigate them.
