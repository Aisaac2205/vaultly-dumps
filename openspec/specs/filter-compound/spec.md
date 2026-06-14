# Spec: filter-compound

## Purpose

A unified, popover-based compound filter pattern for all list views. Supports instant (debounced) and submit modes, active filter chips, and Radix-based controls.

## Requirements

### Requirement: Filter Trigger

The filter system MUST provide a popover-based trigger button that displays an active filter count badge.

- The trigger button SHALL open a popover containing all filter controls.
- The trigger SHALL display a numeric badge when one or more filters are active.

#### Scenario: No filters active
- **WHEN** no filters are applied
- **THEN** the trigger button shows no badge and the popover opens empty

#### Scenario: One filter active
- **WHEN** one filter is applied
- **THEN** the trigger button shows a badge with "1" and the popover reflects the active value

#### Scenario: Multiple filters active
- **WHEN** three filters are applied
- **THEN** the trigger button shows a badge with "3" and the popover reflects all active values

### Requirement: Active Filter Chips

Active filters MUST be displayed above the data table as removable `<Badge variant="outline">` elements with a `<BadgeDot>` indicator.

- Each chip SHALL show the filter label and current value.
- Each chip SHALL include a remove button (e.g., an `X` icon) that clears that specific filter.
- Removing a chip MUST immediately update the table data.

#### Scenario: Remove a filter chip
- **WHEN** the user clicks the remove button on an active filter chip
- **THEN** that filter is cleared, the chip disappears, and the table re-fetches

#### Scenario: Change a filter value
- **WHEN** the user changes a filter value inside the popover
- **THEN** the corresponding chip text updates in real time

### Requirement: Instant Mode

Text-based filters (e.g., search) SHALL use "instant" mode with a debounce of 300ms.

- The filter value is applied automatically after the debounce window.
- No explicit "Apply" button is required.

#### Scenario: Instant mode debounce
- **WHEN** the user types "abc" into a search filter
- **THEN** the filter is applied 300ms after the last keystroke

### Requirement: Submit Mode

Complex filters (e.g., date ranges) MUST use "submit" mode.

- The filter values are collected but not applied until the user clicks an explicit "Apply" button.
- The popover remains open while the user configures the filter.

#### Scenario: Submit mode
- **WHEN** the user selects a date range and clicks "Apply"
- **THEN** the filter is applied, the popover closes, and the table re-fetches

### Requirement: Filter Controls

All select controls inside the filter popover MUST use Radix `<Select>` components.

- No raw `<select>` elements SHALL appear in the filter UI.
- All controls MUST be keyboard-navigable and accessible.

#### Scenario: All controls use Radix Select
- **WHEN** the filter popover is opened
- **THEN** every dropdown is a Radix `<Select>` with proper keyboard behavior

### Requirement: Filter Composition

The filter system MUST be composed from the following sub-components:

- `<Filters.Root>` — context provider for filter state.
- `<Filters.Trigger>` — button that opens the popover and shows the badge.
- `<Filters.Popover>` — the popover container.
- `<Filters.Search>` — text input for instant mode.
- `<Filters.Select>` — dropdown filter for submit mode.
- `<Filters.DateRange>` — date range picker for submit mode.
- `<Filters.ActiveChips>` — chip list above the table.
- `<Filters.Apply>` — apply button for submit mode.

#### Scenario: Compose a filter bar
- **WHEN** a feature mounts `<Filters.Root>` with `<Filters.Search>`, `<Filters.Select>`, and `<Filters.ActiveChips>`
- **THEN** the filter bar, popover, and chips all function together correctly

### Requirement: Reduced Motion

The filter system MUST be safe for `prefers-reduced-motion`.

- Popover open/close transitions degrade to instant when reduced motion is preferred.
- Chip removal transitions degrade to instant when reduced motion is preferred.

#### Scenario: Reduced motion active
- **WHEN** the user prefers reduced motion
- **THEN** the popover and chip animations are instant

#### Scenario: Reduced motion inactive
- **WHEN** the user has no motion preference
- **THEN** the popover and chip removal may use subtle fade/scale animations
