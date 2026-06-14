# Spec: topbar-navigation

## Purpose

A desktop-only topbar providing breadcrumbs, page title, user avatar menu, and a dark-mode toggle slot (non-functional in this change). The topbar is hidden on mobile and accessible via keyboard navigation.

## Requirements

### Requirement: Topbar Layout

The topbar SHALL be `56px` tall (`h-14`), span the full width of the main content area, and display a bottom border using `border-b` with the `--color-border` token.

#### Scenario: Desktop layout
- **WHEN** the application is rendered on a viewport ≥ `md` breakpoint
- **THEN** the topbar is visible at the top of the main content area

#### Scenario: Mobile layout
- **WHEN** the application is rendered on a viewport < `md` breakpoint
- **THEN** the topbar is hidden (`hidden` or equivalent responsive class)

### Requirement: Breadcrumbs

The topbar MUST display breadcrumbs on the left side.

- Breadcrumbs are a chain of links leading to the current page.
- Each breadcrumb segment links to its corresponding route.
- The current page is the last segment and is not a link.

#### Scenario: Desktop with breadcrumbs
- **WHEN** the user navigates to `/dumps`
- **THEN** the topbar shows breadcrumbs (e.g., "Inicio > Dumps") with the last segment as plain text

### Requirement: Page Title

The topbar MUST display the current page title in a consistent format.

- The title is derived from the current route name.
- The title is rendered as a readable heading (e.g., `<h1>` or equivalent).

#### Scenario: Route title displayed
- **WHEN** the user navigates to the Audit page
- **THEN** the topbar shows the title "Auditoría" in a consistent format

### Requirement: User Menu

The topbar MUST display a user avatar and dropdown menu on the right side.

- The avatar is a circular image or initials fallback.
- Clicking the avatar opens a dropdown menu containing "Profile" and "Logout" actions.
- The menu is implemented with a Radix-based dropdown (or equivalent accessible primitive).

#### Scenario: Desktop with user menu open
- **WHEN** the user clicks the avatar
- **THEN** a dropdown menu opens with Profile and Logout options

#### Scenario: Logout action
- **WHEN** the user clicks "Logout"
- **THEN** the logout handler is invoked and the menu closes

### Requirement: Dark Mode Toggle Slot

The topbar MUST include a dark-mode toggle control slot.

- The toggle is present in the UI but non-functional in this change.
- Its state is controlled by a future dark-mode PR.
- The toggle is visually consistent with the rest of the topbar.

#### Scenario: Toggle slot visible
- **WHEN** the topbar is rendered
- **THEN** the dark-mode toggle slot is visible and accessible but does not change the theme

### Requirement: Focus Rings

All interactive elements within the topbar MUST have visible focus rings.

- Breadcrumb links, user avatar, menu items, and the dark-mode toggle SHALL show a focus ring when focused via keyboard.
- The focus ring color is the accent color (`#2563EB` or equivalent token).

#### Scenario: Focus navigation with keyboard
- **WHEN** the user tabs through the topbar
- **THEN** each interactive element receives a visible focus ring
