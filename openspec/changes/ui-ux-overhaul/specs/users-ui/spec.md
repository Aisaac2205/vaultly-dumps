# Spec: users-ui (delta)

> **Note**: This spec is **retroactive documentation** of PR #11 (`feat/ui-users`) of the `ui-ux-overhaul` change. It follows the spec-first discipline codified in commit `4176f63`. It serves as the contract for `sdd-verify` and as a reference for future changes touching the Users UI.

## Purpose

Users page (`apps/web/src/features/users/`). This delta documents the redesigned UI shipped in PR #11, which:

1. Adds missing design system primitives (Stats cards with Stagger, Filters compound, FadeIn page entry).
2. Replaces `window.confirm()` with a proper `Dialog`-based destructive action pattern.
3. Replaces raw `<input>` styling with the shared `Input` component.
4. Exploits the **Better Auth `adminClient` plugin** server-side filter / search / sort options on `listUsers` — capabilities already present in the auth client but previously unused.
5. Adds a `DeleteUserDialog` for confirmation, an `Input` shared primitive, and a password show/hide toggle.

## Cross-App Contract Reference

This feature uses **Better Auth `adminClient` plugin** (already loaded in `apps/web/src/shared/lib/auth-client.ts`) as the API source of truth. There is NO backend controller — the Better Auth admin endpoints handle all CRUD.

### Better Auth admin endpoints used

| Operation | Better Auth call | Request shape | Response |
| --- | --- | --- | --- |
| List users | `authClient.admin.listUsers(query)` | `{ searchValue?, searchField?, searchOperator?, limit?, offset?, sortBy?, sortDirection?, filterField?, filterValue?, filterOperator? }` | `{ users: User[], total: number }` |
| Create user | `authClient.admin.createUser(body)` | `{ email, password, name, role }` | `{ user: User }` |
| Update user | `authClient.admin.updateUser({ userId, data })` | `{ userId, data: { name } }` | `{ user: User }` |
| Set role | `authClient.admin.setRole({ userId, role })` | `{ userId, role: "admin" \| "user" }` | `{ user: User }` |
| Set password | `authClient.admin.setUserPassword({ userId, newPassword })` | `{ userId, newPassword }` | — |
| Remove user | `authClient.admin.removeUser({ userId })` | `{ userId }` | `{ success: boolean }` |

### User shape (from Better Auth)

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  banned: boolean | null;        // null = not banned
  banReason?: string | null;
  banExpires?: string | null;    // ISO 8601
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  emailVerified: boolean;
  image?: string | null;
}
```

If the Better Auth admin schema changes upstream, this spec must be updated FIRST. The frontend is the consumer; the adminClient plugin is the contract.

## ADDED Requirements

### Requirement: User List with Server-Side Search

The Users page MUST call `authClient.admin.listUsers` with `searchValue` and `searchField` parameters to filter at the source (not client-side).

- Default `searchField` is `name` (also matches email as a secondary fallback when `searchOperator` is `contains`).
- `searchOperator` MUST be `contains` for partial-match UX.
- Debounce: 300ms (reuses `Filters.Search` debounce).
- Limit is fixed at 100 (project's current user scale; pagination cursor is deferred).
- Sort is `createdAt desc` so newest users appear first.

#### Scenario: Type into search input
- **WHEN** the user types "isa" in the search field
- **THEN** after 300ms debounce, `listUsers` is called with `{ searchValue: "isa", searchField: "name", searchOperator: "contains", sortBy: "createdAt", sortDirection: "desc", limit: 100 }`
- **AND** the table shows only users whose name contains "isa"

#### Scenario: Clear search
- **WHEN** the user clears the search input
- **THEN** the active filter chip is removed
- **AND** the list refetches without `searchValue`

### Requirement: User Filters (Filters Compound)

The Users page MUST use the `Filters` compound from PR 2b for filter management.

- Filter state is managed by the `useUserFilters` hook inside `UsersFilters.tsx`.
- Filter popover includes: `Filters.Search` (by name) and `Filters.Select` (role: all / admin / user).
- Active filters appear as removable chips via `Filters.ActiveChips`.
- Search is server-side (debounced 300ms). Role is client-side (instant).

#### Scenario: Filter by role
- **WHEN** the user selects "Administradores" from the role dropdown
- **THEN** only users with `role === "admin"` are shown
- **AND** an active chip appears: "Rol: Administradores"

#### Scenario: Combine search + role
- **WHEN** the user has searched "isa" AND selected "Administradores"
- **THEN** the list shows only admins whose name contains "isa"
- **AND** two active chips are visible

#### Scenario: Remove a filter chip
- **WHEN** the user clicks the X on the role chip
- **THEN** the role filter is removed
- **AND** the search filter remains active
- **AND** the list refetches / refilters

### Requirement: Stats Cards with Motion

The Users page MUST show 4 stat cards above the table with staggered entry animation.

- Each card uses the `StatCard` component with `variant="outlined"` (NOT compact).
- Cards are wrapped in `<Stagger>` and each card is a `<StaggerItem>`.
- The stagger uses `transform` and `opacity` only (hardware-accelerated, 220ms duration, 50ms stagger delay).
- Under `prefers-reduced-motion: reduce`, the stagger is bypassed.

#### Scenario: Stats render with data
- **WHEN** users data has loaded
- **THEN** four stat cards display: Total usuarios, Administradores, Activos (no baneados), Nuevos (últimos 7 días)
- **AND** the cards enter with stagger animation

#### Scenario: Stats render with zero data
- **WHEN** there are no users
- **THEN** the stat cards show: 0, 0, 0, 0

#### Scenario: Loading state
- **WHEN** users are being fetched
- **THEN** stat cards render skeleton variants (handled by `StatCard` `loading` prop)

### Requirement: Page-Level Animation

The Users page MUST use `FadeIn` wrapper for page-level entry animation.

- The main content wrapper uses `<FadeIn className="space-y-8 p-4 sm:p-6 lg:p-8">`.
- This replaces the previous padding scheme with responsive padding.
- The `FadeIn` component honors `prefers-reduced-motion`.

#### Scenario: Page loads with animation
- **WHEN** the Users page mounts
- **THEN** the entire page content fades in with an 8px vertical offset (220ms duration, ease-out)

### Requirement: User Table (DataTable)

The Users page MUST render the list using the `DataTable` compound from PR 2b.

- Columns: Nombre, Correo, Rol, Creado, Acciones.
- The "Rol" column renders a `Badge` with `BadgeDot` (success tone for admin, neutral for user) — NOT raw text.
- The "Acciones" column renders icon buttons on desktop (Shield, Pencil, KeyRound, Trash2) and a dropdown menu on mobile.
- Loading state: skeleton rows matching column count.
- Empty state: composed with `UserX` icon + headline + helper text.

#### Scenario: Table renders rows with data
- **WHEN** users data is available
- **THEN** each row shows: Nombre (medium weight), Correo (font-mono text-xs), Rol (Badge), Creado (formatted es-AR), Acciones (icon row)

#### Scenario: Empty state with no users
- **WHEN** the users list is empty
- **THEN** the table shows a composed empty state: `UserX` icon + "No hay usuarios" + helper text "Creá el primer usuario para empezar."

#### Scenario: Loading state
- **WHEN** users are being fetched
- **THEN** the table renders skeleton rows matching the real column count

### Requirement: Create User Dialog

The Users page MUST support creating users via `CreateUserDialog`.

- Trigger: a "Agregar usuario" button in the page header.
- Fields: Nombre, Correo electrónico, Contraseña (with show/hide toggle), Rol.
- Form uses the shared `Input` component for all text fields.
- Validation: email format (HTML5), password min 8 chars, name required.
- Submit calls `authClient.admin.createUser`.
- On success: dialog closes, list refetches, Sonner toast "Usuario creado".

#### Scenario: Open create dialog
- **WHEN** the user clicks "Agregar usuario"
- **THEN** the dialog opens with motion entry animation (scale 0.95→1, opacity 0→1, 200ms ease-out per emil-design-eng)
- **AND** focus moves to the first input

#### Scenario: Submit valid form
- **WHEN** the user fills all fields and submits
- **THEN** `authClient.admin.createUser` is called with `{ email, password, name, role }`
- **AND** on success, the dialog closes, the list refetches, and a toast appears
- **AND** focus returns to the "Agregar usuario" trigger button

#### Scenario: Validation error
- **WHEN** the user submits with an empty name
- **THEN** the browser's native required validation prevents submit
- **AND** the field shows the native error UI

### Requirement: Edit User Dialog

The Users page MUST support editing a user's name via `EditUserDialog`.

- Trigger: Pencil icon button in the row's actions.
- Only `name` is editable (email and role have dedicated flows).
- Dialog pre-fills with the current name.
- Submit is disabled when name is unchanged.
- Calls `authClient.admin.updateUser({ userId, data: { name } })`.

#### Scenario: Edit name
- **WHEN** the user opens the edit dialog, changes the name, and submits
- **THEN** `updateUser` is called with the new name
- **AND** on success, the dialog closes, the list refetches, and a toast appears

### Requirement: Change Password Dialog

The Users page MUST support changing a user's password via `ChangePasswordDialog`.

- Trigger: KeyRound icon button in the row's actions.
- Field: Nueva contraseña (with show/hide toggle).
- Validation: min 8 chars.
- Calls `authClient.admin.setUserPassword`.
- On success: dialog closes, Sonner toast "Contraseña actualizada".

#### Scenario: Toggle password visibility
- **WHEN** the user clicks the eye/eye-off icon
- **THEN** the input type toggles between `password` and `text`
- **AND** the icon swaps accordingly
- **AND** the toggle has `aria-label` for screen readers

### Requirement: Toggle Role (Instant Feedback)

The Shield icon button MUST toggle the user's role instantly — NO enter/exit animation (keyboard-initiated, used many times/day per emil-design-eng).

- Press feedback: `active:scale-[0.97]` (160ms ease-out).
- Disabled state: `disabled:cursor-not-allowed disabled:opacity-50` while mutating.
- The button has `aria-label` describing the next role.

#### Scenario: Toggle admin to user
- **WHEN** the user clicks the Shield on an admin
- **THEN** the button scales to 0.97 on press
- **AND** `setRole({ userId, role: "user" })` is called
- **AND** on success, toast "Rol cambiado a user" appears

### Requirement: Delete User with Confirmation Dialog

The Trash2 button MUST open a `DeleteUserDialog` — NOT `window.confirm()`.

- The dialog shows the user's name, a destructive warning, and a Cancel/Eliminar button pair.
- The Delete button uses `variant="destructive"`.
- On confirm, calls `authClient.admin.removeUser({ userId })`.
- On success: dialog closes, list refetches, toast "Usuario eliminado".
- Self-protection: the current user cannot delete themselves (button disabled with `title`).

#### Scenario: Open delete dialog
- **WHEN** the user clicks the Trash2 button
- **THEN** the `DeleteUserDialog` opens with motion entry animation
- **AND** the dialog shows the user's name as the target

#### Scenario: Confirm deletion
- **WHEN** the user clicks "Eliminar" in the dialog
- **THEN** `removeUser` is called
- **AND** on success, the dialog closes, the list refetches, and a toast appears

#### Scenario: Cancel deletion
- **WHEN** the user clicks "Cancelar" in the dialog
- **THEN** the dialog closes without calling the API
- **AND** no toast appears

#### Scenario: Self-protection
- **WHEN** the row is the currently-authenticated user
- **THEN** the Trash2 button is disabled
- **AND** it has `title="No podés eliminarte a vos mismo"`

### Requirement: Mobile Actions Dropdown (subset)

On viewports < 640px, the actions column MUST render a single dropdown trigger (MoreHorizontal icon) instead of 4 icon buttons.

- The dropdown contains: **Cambiar rol** and **Eliminar** only.
- The "Eliminar" item uses `text-destructive` styling.
- The "Eliminar" item is disabled when the row is the current user.
- **Edit name and change password are desktop-only** in this PR (see Deviations).

#### Scenario: Open actions menu on mobile
- **WHEN** the user taps the MoreHorizontal icon on a row
- **THEN** a dropdown menu opens with 2 items
- **AND** each item triggers its corresponding action

### Requirement: Accessibility (WCAG 2.2 AA)

The Users page MUST comply with WCAG 2.2 AA across all interactions.

- All icon-only buttons have `aria-label` or `title` describing the action.
- All form inputs have associated `<label>` elements (not placeholder-as-label).
- All dialogs trap focus and restore focus to the trigger on close.
- Color is NOT the only signal: `BadgeDot` accompanies role labels; `Badge` variant conveys status.
- Focus rings are visible on all interactive elements (`:focus-visible:ring-2`).
- `prefers-reduced-motion: reduce` collapses stagger and dialog entry animations to instant / opacity-only.

#### Scenario: Keyboard navigation
- **WHEN** the user tabs through the table actions
- **THEN** focus moves through each icon button in order
- **AND** each button has a visible focus ring

#### Scenario: Reduced motion
- **WHEN** the user has `prefers-reduced-motion: reduce` set
- **THEN** page entry, stats stagger, and dialog entry animations are suppressed
- **AND** the UI is fully usable

### Requirement: Toast Feedback (Sonner)

All mutations MUST show Sonner toast feedback on success or error.

- Success: positive message (e.g. "Usuario creado", "Contraseña actualizada").
- Error: error message from `error.message` or generic fallback.
- Toasts are issued by the mutation hooks (`onSuccess` / `onError`), NOT by the components.

## Component Inventory

| Component | File | Purpose |
| --- | --- | --- |
| `UsersStats` | `components/UsersStats.tsx` | 4 stat cards with Stagger |
| `UsersFilters` | `components/UsersFilters.tsx` | Filters compound + `useUserFilters` hook |
| `UsersTable` | `components/UsersTable.tsx` | DataTable with role badge + actions column |
| `UserActions` | `components/UserActions.tsx` | Desktop icon row / mobile dropdown |
| `CreateUserDialog` | `components/CreateUserDialog.tsx` | Create user form |
| `EditUserDialog` | `components/EditUserDialog.tsx` | Edit name form |
| `ChangePasswordDialog` | `components/ChangePasswordDialog.tsx` | Password change with show/hide |
| `DeleteUserDialog` | `components/DeleteUserDialog.tsx` | Destructive confirmation (replaces `window.confirm`) |
| `Input` (shared) | `shared/ui/input.tsx` | Reusable text input (NEW shared primitive) |

## Deviations from Original tasks.md

1. **No backend controller** — PR #11 uses the Better Auth `adminClient` plugin directly instead of a NestJS controller. This simplifies the contract and reduces code surface. The original `users.controller.ts` (if any) is untouched.
2. **No pagination cursor** — `listUsers` is called with `limit: 100` and no offset. Pagination is a follow-up PR when user count exceeds 100.
3. **Only `name` is editable** — Email and role are not editable from `EditUserDialog`; they have dedicated flows (`setRole` via Shield, email change via Better Auth flow — out of scope for this PR).
4. **No ban/unban UI** — Better Auth's `banUser`/`unbanUser` exist in the adminClient but are deferred. The `banned` field is shown in the table when relevant but no toggle is exposed.
5. **Mobile dropdown exposes 2 actions, not 4** — The mobile actions dropdown shows "Cambiar rol" and "Eliminar" only. Edit name and change password remain desktop-only because nesting `DialogTrigger asChild` inside `DropdownMenu.Item asChild` produces inconsistent behavior across browsers, and admin tasks (rename, reset password) are overwhelmingly performed on desktop. If mobile needs them, the cleanest fix is to lift dialog state to `UserActions` and pass `open`/`onOpenChange` as controlled props — deferred to a follow-up.

## Out of Scope (deferred to other PRs)

- Pagination beyond 100 users (cursor-based with `offset` / `limit`)
- Ban / unban toggle UI
- Email change flow
- Bulk actions (bulk delete, bulk role assignment)
- Avatar upload
- Last-login timestamp (requires `authClient.admin.listUserSessions`)
- Activity log per user
