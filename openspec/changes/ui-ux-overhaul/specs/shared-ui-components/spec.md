# Spec: shared-ui-components (delta)

## Purpose

Shared UI primitives used across all features. This delta upgrades button press feedback, card variants, stat-card styling, dialog/sheet/popover entry animations, and the data-table layout while removing deprecated patterns.

## ADDED Requirements

### Requirement: Pagination Component

The system SHALL provide a `<Pagination>` component as defined in the `pagination` spec.

- The pagination component is placed inside the data-table pagination slot.

#### Scenario: Pagination in data-table
- **WHEN** a data-table is rendered with paginated data
- **THEN** the pagination component is visible below the table

### Requirement: Filter Compound Component

The system SHALL provide a `<Filters>` compound component as defined in the `filter-compound` spec.

- The filter component is composed of `<Filters.Root>`, `<Filters.Trigger>`, `<Filters.Popover>`, `<Filters.Search>`, `<Filters.Select>`, `<Filters.DateRange>`, `<Filters.ActiveChips>`, and `<Filters.Apply>`.

#### Scenario: Filter component in feature
- **WHEN** a list feature mounts the filter compound component
- **THEN** the trigger, popover, and active chips all function correctly

### Requirement: Motion Primitives

The system SHALL provide `<FadeIn>`, `<Stagger>`, and `<PressFeedback>` motion primitives as defined in the `motion-primitives` spec.

- These primitives are used for entrance animations and press feedback across all features.

#### Scenario: Motion primitives in feature
- **WHEN** a feature page mounts
- **THEN** content enters with `<FadeIn>` and lists reveal with `<Stagger>`

## MODIFIED Requirements

### Requirement: Button Press Feedback

The `<Button>` component MUST include `:active` press feedback.

- `:active` state SHALL apply `transform: scale(0.97)`.
- The transition SHALL include `transform 160ms var(--ease-out-strong)` in addition to existing color transitions.
- CVA variants remain unchanged.

(Previously: `transition-colors` only, no `:active` transform feedback)

#### Scenario: Button press
- **WHEN** the user presses a button
- **THEN** the button scales to `0.97` with a 160ms ease-out-strong transition

#### Scenario: Reduced motion button press
- **WHEN** the user prefers reduced motion and presses a button
- **THEN** the scale change is instant (no animation)

### Requirement: Card Variants

The `<Card>` component MUST support three variants: `elevated`, `outlined`, and `subtle`.

- `elevated`: `shadow-md`, no border.
- `outlined`: `border` with `border-color`, no shadow.
- `subtle`: `bg-muted` background, no shadow, no border.
- The default border radius SHALL be `rounded-lg` (previously `rounded-xl`).
- The banned combination: `1px border + drop shadow > 8px` on the same element MUST NOT be used.

(Previously: single variant with `rounded-xl bg-card shadow-sm`, no explicit variants)

#### Scenario: Elevated card
- **WHEN** a card is rendered with `variant="elevated"`
- **THEN** it has `shadow-md` and no border

#### Scenario: Outlined card
- **WHEN** a card is rendered with `variant="outlined"`
- **THEN** it has a `1px border` and no shadow

#### Scenario: Subtle card
- **WHEN** a card is rendered with `variant="subtle"`
- **THEN** it has `bg-muted` and no shadow or border

#### Scenario: Banned combination rejected
- **WHEN** a developer attempts to combine `1px border` with `drop shadow > 8px` on the same card
- **THEN** the design system or linter rejects the combination

### Requirement: Stat Card Redesign

The `<StatCard>` component MUST use the `outlined` card variant and a `<BadgeDot>` for the trend indicator.

- The card wrapper SHALL be the `outlined` variant (no tinted background).
- The trend indicator SHALL use `<BadgeDot>` (a small colored dot) instead of a tinted pill.
- The muted icon opacity (`text-muted-foreground/70`) SHALL be removed; the icon uses the default muted color.

(Previously: default card variant with tinted-pill trend background and muted-icon-opacity)

#### Scenario: Stat card with positive trend
- **WHEN** a stat card renders with a positive trend
- **THEN** the card is outlined and the trend shows a green `<BadgeDot>`

#### Scenario: Stat card with negative trend
- **WHEN** a stat card renders with a negative trend
- **THEN** the card is outlined and the trend shows a red `<BadgeDot>`

#### Scenario: Stat card loading
- **WHEN** a stat card is in loading state
- **THEN** the skeleton is rendered inside the outlined card wrapper

### Requirement: Dialog Entry Animation

The `<DialogContent>` entry animation MUST start from `scale(0.95) opacity(0)` and use `var(--ease-out-strong)` easing.

- `transform-origin: center` MUST be applied.
- `scale(0)` MUST NOT be used at any point.
- The animation is applied to the Radix `DialogPrimitive.Content` element.

(Previously: Tailwind `zoom-in-95` with default easing and no explicit transform-origin)

#### Scenario: Dialog opens
- **WHEN** a dialog is triggered
- **THEN** the content scales from `0.95` to `1` and fades in with `ease-out-strong`

#### Scenario: Dialog close
- **WHEN** a dialog is dismissed
- **THEN** the content scales back to `0.95` and fades out

### Requirement: Sheet Entry Animation

The `<SheetContent>` entry animation MUST match the dialog entry animation: `scale(0.95) opacity(0)` with `var(--ease-out-strong)` easing.

- `transform-origin: center` MUST be applied.
- The `aria-describedby={undefined}` fix for accessibility MUST be present.

(Previously: slide-in animations without scale/opacity entry, no `aria-describedby` fix)

#### Scenario: Sheet opens
- **WHEN** a sheet is triggered
- **THEN** the content scales from `0.95` to `1` and fades in with `ease-out-strong` while sliding in

#### Scenario: Sheet accessibility
- **WHEN** a screen reader reads the sheet
- **THEN** `aria-describedby` is undefined to prevent orphaned descriptions

### Requirement: Popover Animation

The `<PopoverContent>` MUST keep `transform-origin: var(--radix-popover-content-transform-origin)` and use stronger easing.

- The `origin-(--radix-popover-content-transform-origin)` class remains.
- Easing is updated to `var(--ease-out-strong)` for open and close animations.

(Previously: `origin-(--radix-popover-content-transform-origin)` with default easing)

#### Scenario: Popover opens
- **WHEN** a popover is triggered
- **THEN** the content scales and fades in with origin-aware transform-origin and strong easing

### Requirement: Data Table Layout

The `<DataTable>` component MUST include a pagination slot below the table and update cell/header styling.

- A pagination slot is rendered below the table body.
- Header cells MUST use `truncate` to prevent text overflow.
- `sm:table-fixed` is removed; layout is determined by content.
- Skeleton-to-data transition MUST use `@starting-style` for a smooth transition.

(Previously: no pagination slot, `sm:table-fixed` present, no `@starting-style` transition)

#### Scenario: Data table with pagination slot
- **WHEN** a data table is rendered with paginated data
- **THEN** a pagination slot is visible below the table

#### Scenario: Header cell truncation
- **WHEN** a header cell contains a long label
- **THEN** the text is truncated with ellipsis

#### Scenario: Skeleton to data transition
- **WHEN** data loads after the skeleton state
- **THEN** the transition from skeleton to data is smooth using `@starting-style`

## REMOVED Requirements

### Requirement: Tinted-Pill Trend Style

(Reason: Replaced by outline card variant + `<BadgeDot>` trend indicator on stat cards)

The tinted-pill background (`bg-success-bg`, `bg-error-bg`) on stat-card trends is removed.

#### Scenario: No tinted pill
- **WHEN** a stat card renders with a trend
- **THEN** no tinted pill background is applied

### Requirement: 1px Border + Drop Shadow Combination

(Reason: Banned per design system to prevent visual noise)

The combination of `1px border` and `drop shadow > 8px` on the same element is prohibited.

#### Scenario: Banned combination absent
- **WHEN** inspecting any card component
- **THEN** no element has both `1px border` and `drop shadow > 8px`

### Requirement: Transition-Colors Only on Button

(Reason: Button now transitions both colors and transform)

The `transition-colors` class on `<Button>` is replaced by a transition that includes both color and transform properties.

#### Scenario: Button transition includes transform
- **WHEN** inspecting a button element
- **THEN** the transition property includes `transform` in addition to `color` and `background-color`
