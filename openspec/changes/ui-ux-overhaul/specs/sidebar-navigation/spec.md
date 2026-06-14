# Spec: sidebar-navigation (delta)

## Purpose

Sidebar navigation and mobile drawer. This delta replaces the active indicator, migrates hardcoded colors to semantic tokens, and improves accessibility.

## MODIFIED Requirements

### Requirement: Active State Redesign

The active navigation item state MUST use a subtle surface highlight and a hairline accent indicator.

- Active background: `bg-sidebar-active` (previously `bg-white/10`).
- Active indicator: a `2px` hairline accent bar (`#2563EB`) on the LEFT side of the item.
- The previous `border-r-2 border-white` right-side stripe is removed.

(Previously: `border-r-2 border-white bg-white/10 text-white` right-side stripe)

#### Scenario: Desktop active state
- **WHEN** a navigation item is active
- **THEN** it shows `bg-sidebar-active` and a `2px` accent bar on the left

#### Scenario: Inactive state
- **WHEN** a navigation item is inactive
- **THEN** it shows no accent bar and no active background

### Requirement: Sidebar Token Colors

The sidebar background MUST use the `bg-sidebar` token instead of the hardcoded `bg-black`.

- Desktop sidebar: `bg-sidebar` replaces `bg-black`.
- Mobile sheet sidebar: `bg-sidebar` replaces `bg-black`.

(Previously: `bg-black` hardcoded on both desktop and mobile sidebar)

#### Scenario: Desktop sidebar token
- **WHEN** the desktop sidebar is rendered
- **THEN** the background color is `bg-sidebar` (not `bg-black`)

#### Scenario: Mobile sheet token
- **WHEN** the mobile sidebar sheet is rendered
- **THEN** the background color is `bg-sidebar` (not `bg-black`)

### Requirement: Use `cn()` Utility

All className composition in the sidebar MUST use the `cn()` utility instead of inline template strings.

- NavLink className function is refactored to use `cn()`.
- Mobile header classes are refactored to use `cn()` where applicable.

(Previously: inline template strings in NavLink className)

#### Scenario: NavLink uses cn()
- **WHEN** the sidebar renders navigation items
- **THEN** the active/inactive className is composed via `cn()`

## ADDED Requirements

### Requirement: Focus Rings on Nav Items

All navigation items (desktop and mobile) MUST have visible focus rings.

- Focus ring color is the accent color (`#2563EB` or equivalent token).
- Focus rings are visible when navigating via keyboard.

#### Scenario: Keyboard navigation
- **WHEN** the user tabs through the sidebar navigation
- **THEN** each nav item shows a visible focus ring

## REMOVED Requirements

### Requirement: Border-R-2 Border-White Active Style

(Reason: Banned side-stripe pattern per design system; replaced by hairline accent indicator on left)

The `border-r-2 border-white` right-side active indicator is removed.

#### Scenario: No right-side stripe
- **WHEN** a navigation item is active
- **THEN** no `border-right` white stripe is present
