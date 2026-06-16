# Spec: dashboard-ui (delta)

> **Note**: This spec documents PR #10 (`feat/ui-dashboard`). It serves as the contract for `sdd-verify` and as a reference for future changes touching the Dashboard UI.

## Purpose

Dashboard page (`apps/web/src/features/dashboard/`). Este delta documenta el rediseño de PR #10: entrada animada, KPIs con Sparkline, indicadores de estado accesibles, reorganización del sidebar en `SystemHealthCard`, y cumplimiento WCAG 2.2.

## ADDED Requirements

### Requirement: Entrada Animada de Página

El Dashboard DEBE envolver todo su contenido en `<FadeIn>` y usar `<Stagger>` en `KpiGrid`.

- `<FadeIn>` envuelve todo el contenido de la página.
- `<Stagger>` envuelve las tarjetas de `KpiGrid`; cada tarjeta es `<StaggerItem>`.
- Animación usa solo `transform` y `opacity` (220ms, ease-out, 50ms stagger).
- `prefers-reduced-motion: reduce` desactiva las animaciones.

#### Scenario: Dashboard loads with FadeIn animation
- **WHEN** the Dashboard page mounts
- **THEN** the page fades in with 8px vertical offset over 220ms

#### Scenario: Reduced motion disables animations
- **GIVEN** the system preference is `prefers-reduced-motion: reduce`
- **WHEN** the Dashboard mounts
- **THEN** content is visible immediately with no motion

### Requirement: KPI Grid con Sparkline

`KpiGrid` DEBE renderizar 4 `StatCard` con `variant="outlined"`.

- La tarjeta "Backups últimos 7 días" MUESTRA un Sparkline derivado del query `dailyCounts` (últimos 7 días, sumando `scheduled + manual`).
- COMO MÁXIMO una tarjeta tiene decoración Sparkline; las demás muestran solo número.

#### Scenario: KpiGrid renders four outlined StatCards
- **WHEN** dashboard data is loaded
- **THEN** four `StatCard` with `variant="outlined"` appear showing icon, label, and value

#### Scenario: Sparkline card shows last 7 days
- **GIVEN** `dailyCounts` returns data for the last 7 days
- **WHEN** the backups card renders
- **THEN** the Sparkline displays the series of `scheduled + manual` per day

#### Scenario: Only one KPI card has sparkline decoration
- **WHEN** the grid is inspected visually
- **THEN** exactly one card has a Sparkline; the others show plain numbers

#### Scenario: Stats render with zero data
- **GIVEN** no backup data exists for the period
- **WHEN** the grid renders
- **THEN** all cards show "0" or their appropriate fallback

### Requirement: Failure Alert Banner

El banner de alerta DEBE aparecer solo cuando `failed7d > 0`.

- Se renderiza condicionalmente.
- Si `failed7d === 0`, el banner NO está en el DOM.

#### Scenario: Banner appears when failures exist
- **GIVEN** `failed7d` is greater than 0
- **WHEN** the Dashboard loads
- **THEN** the `FailureAlertBanner` is rendered

#### Scenario: Banner is hidden when no failures
- **GIVEN** `failed7d` is 0
- **WHEN** the Dashboard loads
- **THEN** the banner is absent from the DOM

### Requirement: Backup Area Chart

El gráfico DEBE renderizar con el filtro de rango por defecto.

- `BackupAreaChart` muestra datos filtrados por rango.
- El rango por defecto se establece al montar el componente.

#### Scenario: Chart renders with default range
- **WHEN** `BackupAreaChart` mounts
- **THEN** it renders with the default range filter selected

### Requirement: Backup and Restore Timelines

`BackupTimeline` y `RestoreTimeline` DEBEN usar `<StatusBadge>` y `<DataTable>`.

- `BackupTimeline` muestra los últimos 15 backups; `RestoreTimeline` los últimos 7 restores.
- Ambas tablas usan `<StatusBadge>` (icono + texto + color) en la columna de estado.
- Los títulos de sección usan `<h2>` (no `<h3>`).

#### Scenario: BackupTimeline shows recent backups with StatusBadge
- **WHEN** `BackupTimeline` renders with data
- **THEN** it shows up to 15 rows with `StatusBadge` for each status

#### Scenario: RestoreTimeline shows recent restores with StatusBadge
- **WHEN** `RestoreTimeline` renders with data
- **THEN** it shows up to 7 rows with `StatusBadge` for each status

#### Scenario: StatusBadge announces text to screen readers
- **GIVEN** a job has status `completed`
- **WHEN** a screen reader reads the row
- **THEN** it announces "Completado" (not just color)

#### Scenario: Timeline empty state uses EmptyState
- **WHEN** a timeline has no jobs
- **THEN** it shows the shared `<EmptyState>` with icon, title, and description

### Requirement: System Health Card

`SystemHealthCard` DEBE reemplazar a `StorageCard` y `ConnectionHealthCard`.

- Es un solo `Card` con dos secciones verticales apiladas: Almacenamiento R2 y Conexiones.
- Los títulos de sección usan `<h2>`.

#### Scenario: SystemHealthCard shows storage and connections
- **WHEN** `SystemHealthCard` renders with data
- **THEN** it displays the R2 storage section and the connections list section

#### Scenario: Connection list shows state badge with text label
- **WHEN** the connections section renders
- **THEN** each connection shows a state badge with both text and color

#### Scenario: SystemHealthCard empty state uses EmptyState
- **WHEN** no connections or storage data exist
- **THEN** it shows the shared `<EmptyState>` component

### Requirement: Upcoming Cronjobs Card

`UpcomingCronjobsCard` DEBE mostrar los próximos 4 cronjobs activos.

- Muestra hasta 4 cronjobs con nombre y hora de ejecución.
- Si no hay cronjobs activos, muestra `<EmptyState>`.

#### Scenario: Card shows next 4 active cronjobs
- **WHEN** the card renders with active cronjobs
- **THEN** it displays up to 4 cronjobs with name and next run time

#### Scenario: Empty state when no upcoming cronjobs
- **WHEN** there are no active upcoming cronjobs
- **THEN** it shows `<EmptyState>` with icon and descriptive text

### Requirement: Auto-Refresh Indicator

El indicador DEBE actualizar datos a 15s/30s/60s sin animación de spinner.

- El intervalo preserva las cadencias existentes.
- La retroalimentación visual es solo el cambio de texto del timestamp.
- NO hay animación de spinner ni rotación de ícono.

#### Scenario: Auto-refresh updates data at configured intervals
- **WHEN** the auto-refresh interval elapses
- **THEN** data refetches and the UI updates

#### Scenario: Timestamp text changes on refresh
- **WHEN** a refresh cycle completes
- **THEN** the timestamp text changes (e.g. "Actualizado hace 15s")

#### Scenario: No spinner animation during refresh
- **WHEN** data is refreshing
- **THEN** no spinner or rotating icon is present; only static text is shown

### Requirement: Keyboard Navigation and Focus

Todos los elementos interactivos DEBEN ser accesibles por teclado.

- El orden de tabulación sigue: header → KPIs → chart → timelines → sidebar.
- No hay trampas de teclado. Todo elemento interactivo muestra `:focus-visible`.
- Todo objetivo táctil nuevo mide al menos 24×24 px.

#### Scenario: Tab follows logical focus order
- **WHEN** the user presses Tab repeatedly
- **THEN** focus moves through header, KPIs, chart, timelines, and sidebar in order

#### Scenario: Focus-visible ring on interactive elements
- **WHEN** interactive elements receive keyboard focus
- **THEN** a visible `:focus-visible` ring is displayed

#### Scenario: No keyboard traps
- **WHEN** focus enters any component
- **THEN** the user can Tab out of it without getting trapped

### Requirement: Accessible Status and Heading Hierarchy

El color NO DEBE ser el único diferenciador de estado. La jerarquía de encabezados NO DEBE saltar niveles.

- `StatusBadge` usa icono + texto + color (WCAG 1.4.1).
- Hay un solo `<h1>` ("Dashboard" en `PageHeader`). Cada sección usa `<h2>`.

#### Scenario: Heading hierarchy is h1 then h2 per section
- **WHEN** the heading structure is inspected
- **THEN** there is one `<h1>` followed by `<h2>` elements for each section with no skipped levels

#### Scenario: Color is not sole differentiator for status
- **WHEN** a timeline row renders a status
- **THEN** `StatusBadge` provides icon, text label, and color

#### Scenario: Sparkline has accessible label
- **WHEN** a screen reader encounters the Sparkline
- **THEN** it reads an `aria-label` describing the 7-day values (e.g. "Backups últimos 7 días: 12, 18, 14, 22, 19, 25, 21")

### Requirement: Live Regions and Color Contrast

El sistema DEBE anunciar actualizaciones y mantener contraste suficiente.

- Existe una región `aria-live="polite"` oculta visualmente que anuncia "Dashboard actualizado" tras cada ciclo de auto-refresh.
- Los tokens de color garantizan contraste ≥ 4.5:1 para texto normal y ≥ 3:1 para texto grande y componentes UI.

#### Scenario: aria-live announces dashboard update
- **WHEN** auto-refresh completes a data cycle
- **THEN** the polite live region announces "Dashboard actualizado"

#### Scenario: Color contrast meets WCAG thresholds
- **WHEN** contrast is verified against design tokens
- **THEN** body text meets 4.5:1 and large text/UI components meet 3:1

## REMOVED Requirements

### Requirement: StorageCard and ConnectionHealthCard as separate components

(Reason: merged into a single `SystemHealthCard` to reduce the "wall of cards" from 4 to 3 in the sidebar. The files `StorageCard.tsx` and `ConnectionHealthCard.tsx` are deleted.)

## Cross-App Contract Reference

- `dailyCounts` query returns `[{ date; scheduled; manual }]` used to derive the Sparkline series.
- `StatusBadge`, `EmptyState`, `FadeIn`, `Stagger`, `StaggerItem`, and `StatCard` primitives are consumed from shared UI.

## Out of Scope

- `TrendIndicator` on the success-rate card (no honest delta data source).
- New backend endpoints for dashboard KPIs.
- Skip link (site-wide concern, deferred to Layout-level change).
- Full dark mode wiring.

## Deviations from Original tasks.md

1. **No `TrendIndicator`** — Success-rate card shows plain text only.
2. **SystemHealthCard uses vertical sections, NOT tabs** — Storage and connections are stacked vertically inside one card.
3. **AutoRefreshIndicator has NO spinner** — Only timestamp text changes; `aria-live="polite"` handles screen reader feedback.
