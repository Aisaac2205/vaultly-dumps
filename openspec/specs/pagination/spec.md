# Spec: pagination

## Purpose

Server-side pagination for list endpoints with a reusable frontend `<Pagination>` component. Provides Spanish-labeled navigation, page-size control, total count display, and next-page prefetch on hover.

## Requirements

### Requirement: Pagination Query Params

All paginated list endpoints MUST accept `page` and `pageSize` query parameters.

- `page` defaults to `1`, minimum `1`.
- `pageSize` defaults to `25`, minimum `1`, maximum `100`.
- The backend SHALL validate these parameters using `@IsInt`, `@Min`, `@Max`, `@IsOptional`, and `@Type(() => Number)` decorators from `class-validator` and `class-transformer`.

#### Scenario: Default pagination
- **WHEN** a request is made to a paginated endpoint without query params
- **THEN** the response uses `page=1` and `pageSize=25`

#### Scenario: Custom page size
- **WHEN** a request is made with `pageSize=50`
- **THEN** the response returns 50 items per page

#### Scenario: Invalid page size
- **WHEN** a request is made with `pageSize=200`
- **THEN** the backend returns a `400 Bad Request` validation error

#### Scenario: Negative page
- **WHEN** a request is made with `page=0`
- **THEN** the backend returns a `400 Bad Request` validation error

### Requirement: Paginated Response Shape

The backend MUST return paginated lists in a wrapped DTO with the exact shape:

```typescript
{ data: T[], total: number, page: number, pageSize: number }
```

#### Scenario: Empty list
- **WHEN** a paginated list has zero total items
- **THEN** the response contains `data: []`, `total: 0`, `page: 1`, `pageSize: <requested>`

#### Scenario: Single page
- **WHEN** a paginated list has 12 items and `pageSize=25`
- **THEN** the response contains `data` with all 12 items, `total: 12`, `page: 1`, `pageSize: 25`

#### Scenario: Multiple pages
- **WHEN** a paginated list has 234 items and `pageSize=25`
- **THEN** the response on page 1 contains `data` with 25 items, `total: 234`, `page: 1`, `pageSize: 25`

### Requirement: Pagination Component

The frontend SHALL render a `<Pagination>` component with Spanish labels.

- Previous/next buttons labeled "Anterior" and "Siguiente".
- A page-size selector offering `[10, 25, 50, 100]` via Radix `<Select>`.
- A total count display formatted as "Mostrando X-Y de Z" (e.g., "Mostrando 1-10 de 234").

#### Scenario: Render with no items
- **WHEN** the total is `0`
- **THEN** the component shows "Mostrando 0 de 0" and disables pagination controls

#### Scenario: Render with one page
- **WHEN** the total is less than or equal to `pageSize`
- **THEN** the component shows the range and disables page navigation

#### Scenario: Render with multiple pages
- **WHEN** the total is greater than `pageSize`
- **THEN** the component shows the current range, enables prev/next, and allows page-size changes

#### Scenario: Change page size
- **WHEN** the user selects `50` from the page-size dropdown
- **THEN** the component resets to `page=1` and requests the new size

### Requirement: Prefetch on Hover

The frontend MUST prefetch the next page when the user hovers over the "Siguiente" button.

#### Scenario: Hover next button
- **WHEN** the user hovers over the next page button
- **THEN** the application fetches the next page data in the background

#### Scenario: No hover on last page
- **WHEN** the user is on the last page and hovers over the next button
- **THEN** no prefetch occurs (button is disabled)

### Requirement: Reduced Motion

The pagination component MUST be safe for `prefers-reduced-motion`.

- **WHEN** `prefers-reduced-motion: reduce` is active, the component renders without animations and transitions are instant.
- **WHEN** `prefers-reduced-motion: no-preference`, the component may use subtle opacity/transform transitions for page changes.

#### Scenario: Reduced motion active
- **WHEN** the user prefers reduced motion
- **THEN** the component renders with instant transitions and no entrance animations

#### Scenario: Reduced motion inactive
- **WHEN** the user has no motion preference
- **THEN** the component may use subtle opacity/transform transitions for page changes
