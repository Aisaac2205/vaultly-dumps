# Tasks: UI/UX Overhaul

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

## 1. Overview
- **Total forecast**: ~2500 lines (compared to design estimate of 2800-3900)
- **Number of PRs**: 13 (with PR 2 split into 2a and 2b, making it 14 total PRs)
- **Critical risks**: Shared UI component refactors affect the entire app. Backend pagination contract changes could break frontend if not synced properly.

## 2. PR-by-PR Task Breakdown

### PR 1: feat/ui-foundation ✅
**PR total line estimate:** ~180
**PR status:** ✅ Complete — commit `ad7de0d`

#### T1-01 Add motion dependency ✅
**Description:** Install `motion` and update package.json.
**Files:**
- `apps/web/package.json` (modified)
- `pnpm-lock.yaml` (modified)
**Line estimate:** 20
**Depends on:** none
**Acceptance:**
- `motion` is added to web dependencies
- `pnpm install` succeeds

#### T1-02 Add CSS tokens ✅
**Description:** Add accent, easing, duration tokens and dark-mode slots to globals.css.
**Files:**
- `apps/web/src/shared/styles/globals.css` (modified)
**Line estimate:** 50
**Depends on:** T1-01
**Acceptance:**
- Variables exist for `color-accent`, easings, durations
- `[data-theme="dark"]` slots added

#### T1-03 Create motion primitives ✅
**Description:** Implement `FadeIn`, `Stagger`, and `PressFeedback` using motion.
**Files:**
- `apps/web/src/shared/ui/motion/FadeIn.tsx` (+)
- `apps/web/src/shared/ui/motion/Stagger.tsx` (+)
- `apps/web/src/shared/ui/motion/PressFeedback.tsx` (+)
**Line estimate:** 110
**Depends on:** T1-01
**Acceptance:**
- Components animate only `transform` and `opacity`
- Honors `useReducedMotion`

---

### PR 2a: feat/ui-shared-basics
**PR total line estimate:** ~120
**PR status:** ✅ within 400-line budget

#### T2a-01 Update Button
**Description:** Add `:active` scale transform and transition.
**Files:**
- `apps/web/src/shared/ui/button.tsx` (modified)
**Line estimate:** 20
**Depends on:** PR 1
**Acceptance:**
- Button shrinks to `0.97` on press

#### T2a-02 Update Card variants
**Description:** Add `elevated`, `outlined`, `subtle` variants; set rounded-lg.
**Files:**
- `apps/web/src/shared/ui/card.tsx` (modified)
**Line estimate:** 30
**Depends on:** PR 1
**Acceptance:**
- Card accepts variant prop via CVA

#### T2a-03 Update StatCard and Badge
**Description:** Refactor StatCard to use outlined variant and BadgeDot.
**Files:**
- `apps/web/src/shared/ui/stat-card.tsx` (modified)
- `apps/web/src/shared/ui/badge.tsx` (modified)
**Line estimate:** 70
**Depends on:** T2a-02
**Acceptance:**
- StatCard uses BadgeDot for trends
- Muted opacity removed from icons

---

### PR 2b: feat/ui-shared-complex
**PR total line estimate:** ~350
**PR status:** ⚠️ APPROACHING (300-400)

#### T2b-01 Update Overlay Animations
**Description:** Refactor Dialog, Sheet, and Popover entrance animations.
**Files:**
- `apps/web/src/shared/ui/dialog.tsx` (modified)
- `apps/web/src/shared/ui/sheet.tsx` (modified)
- `apps/web/src/shared/ui/popover.tsx` (modified)
**Line estimate:** 70
**Depends on:** PR 2a
**Acceptance:**
- Dialog/Sheet use motion/react interruptible scale+fade
- Popover uses `ease-out-strong`

#### T2b-02 Update DataTable
**Description:** Add pagination slot, truncate headers, add @starting-style.
**Files:**
- `apps/web/src/shared/ui/data-table.tsx` (modified)
**Line estimate:** 40
**Depends on:** PR 2a
**Acceptance:**
- Table layouts are content-driven (no sm:table-fixed)
- Smooth skeleton-to-data transition

#### T2b-03 Create Pagination Component
**Description:** Implement Pagination UI with Spanish labels and page size select.
**Files:**
- `apps/web/src/shared/ui/pagination.tsx` (+)
**Line estimate:** 100
**Depends on:** PR 2a
**Acceptance:**
- Displays "Mostrando X-Y de Z"
- Honors reduced motion

#### T2b-04 Create Filters Compound Component
**Description:** Build popover-based filter bar with active chips.
**Files:**
- `apps/web/src/shared/ui/filters.tsx` (+)
**Line estimate:** 140
**Depends on:** T2b-01
**Acceptance:**
- Composable `<Filters.*>` sub-components
- Instant and Submit modes supported

---

### PR 3: feat/ui-shell
**PR total line estimate:** ~200
**PR status:** ✅ within 400-line budget

#### T3-01 Redesign Sidebar
**Description:** Update active state indicator and use semantic tokens via `cn()`.
**Files:**
- `apps/web/src/shared/components/Sidebar.tsx` (modified)
**Line estimate:** 60
**Depends on:** PR 2b
**Acceptance:**
- Active state uses left hairline indicator
- Uses `bg-sidebar` and `bg-sidebar-active` tokens

#### T3-02 Create Topbar
**Description:** Implement desktop Topbar with breadcrumbs and user menu.
**Files:**
- `apps/web/src/shared/components/Topbar.tsx` (+)
**Line estimate:** 90
**Depends on:** PR 2b
**Acceptance:**
- Hidden on mobile, visible on desktop
- Breadcrumbs dynamically reflect route

#### T3-03 Update Layout
**Description:** Integrate Topbar and AnimatePresence main wrapper.
**Files:**
- `apps/web/src/shared/components/Layout.tsx` (modified)
**Line estimate:** 50
**Depends on:** T3-01, T3-02
**Acceptance:**
- Page transitions configured (motion pass finalizes this later)

---

### PR 4: feat/ui-pagination-backend
**PR total line estimate:** ~200
**PR status:** ✅ within 400-line budget

#### T4-01 Create generic DTO
**Description:** Add `PaginatedResponseDto`.
**Files:**
- `apps/api/src/common/dto/paginated-response.dto.ts` (+)
**Line estimate:** 15
**Depends on:** none
**Acceptance:**
- Generic wrapper available

#### T4-02 Backup pagination
**Description:** Implement `ListHistoryQueryDto` and update repo/service/controller.
**Files:**
- `apps/api/src/modules/backup/dto/list-history-query.dto.ts` (+)
- `apps/api/src/modules/backup/dto/index.ts` (+)
- `apps/api/src/modules/backup/backup.repository.ts` (modified)
- `apps/api/src/modules/backup/backup.service.ts` (modified)
- `apps/api/src/modules/backup/backup.controller.ts` (modified)
**Line estimate:** 70
**Depends on:** T4-01
**Acceptance:**
- `GET /backups/history` accepts and returns paginated data

#### T4-03 Audit pagination
**Description:** Consolidate filters into `ListAuditLogsQueryDto` and update repo/service/controller.
**Files:**
- `apps/api/src/modules/audit/dto/list-audit-logs-query.dto.ts` (+)
- `apps/api/src/modules/audit/dto/index.ts` (+)
- `apps/api/src/modules/audit/audit.repository.ts` (modified)
- `apps/api/src/modules/audit/audit.service.ts` (modified)
- `apps/api/src/modules/audit/audit.controller.ts` (modified)
**Line estimate:** 115
**Depends on:** T4-01
**Acceptance:**
- `GET /audit` accepts pagination + filters validated by DTO

---

### PR 5: feat/ui-dumps
**PR total line estimate:** ~180
**PR status:** ✅ within 400-line budget

#### T5-01 Refactor Dumps hook ✅
**Description:** Adopt server-side pagination in TanStack Query.
**Files:**
- `apps/web/src/features/dumps/hooks/useDumps.ts` (modified)
- `apps/web/src/features/dumps/hooks/useDumps.test.tsx` (created)
**Line estimate:** 40 (+20 for test)
**Depends on:** PR 4
**Acceptance:**
- [x] Passes page/pageSize to API

#### T5-02 Update Dumps UI ✅
**Description:** Adopt Pagination, Filters, FadeIn, Stagger, and new StatCards.
**Files:**
- `apps/web/src/features/dumps/components/DumpsStats.tsx` (modified)
- `apps/web/src/features/dumps/components/DumpsTable.tsx` (modified)
- `apps/web/src/features/dumps/components/DumpsFilters.tsx` (modified)
- `apps/web/src/features/dumps/components/DumpActions.tsx` (modified)
- `apps/web/src/features/dumps/index.tsx` (modified)
- `apps/web/src/shared/ui/stat-card.tsx` (modified)
**Line estimate:** 140
**Depends on:** PR 3, T5-01
**Acceptance:**
- [x] UI components use new primitives and compound filters

---

### PR 6: feat/ui-audit
**PR total line estimate:** ~270 (includes T6-00 spec, ~80 lines)
**PR status:** ✅ within 400-line budget

#### T6-00 Write audit-ui spec
**Description:** Create `openspec/changes/ui-ux-overhaul/specs/audit-ui/spec.md` documenting Audit UI behavior, scenarios, and cross-app contract with audit-api.
**Files:**
- `openspec/changes/ui-ux-overhaul/specs/audit-ui/spec.md` (+)
**Line estimate:** 80
**Depends on:** none
**Acceptance:**
- Spec has 4+ scenarios (WHEN...THEN...) covering: paginated audit list, filter combinations, empty state, error handling
- Cross-app contract with `audit-api` referenced (paginated response shape from PR #4)
- TanStack Query migration documented (replacing the prior `useEffect` + `fetch` pattern)
- Filters compound pattern from PR 2b referenced
- Pagination compound from PR 2b referenced

#### T6-01 Migrate Audit to TanStack Query
**Description:** Rewrite `useAudit.ts` from plain `useEffect` to `useQuery` with pagination.
**Files:**
- `apps/web/src/features/audit/hooks/useAudit.ts` (modified)
- `apps/web/src/features/audit/types.ts` (modified)
**Line estimate:** 70
**Depends on:** PR 4
**Acceptance:**
- Uses TanStack Query for caching and fetching

#### T6-02 Update Audit UI
**Description:** Adopt Pagination, Filters, FadeIn, and Stagger.
**Files:**
- `apps/web/src/features/audit/components/AuditTable.tsx` (modified)
- `apps/web/src/features/audit/components/AuditFilters.tsx` (modified)
**Line estimate:** 120
**Depends on:** PR 3, T6-01
**Acceptance:**
- Audit views match the new design system

---

### PR 7: feat/ui-connections
**PR total line estimate:** ~230 (includes T7-00 spec, ~80 lines)
**PR status:** ✅ within 400-line budget

#### T7-00 Write connections-ui spec
**Description:** Create `openspec/changes/ui-ux-overhaul/specs/connections-ui/spec.md` documenting Connections UI behavior, scenarios, and cross-app contract.
**Files:**
- `openspec/changes/ui-ux-overhaul/specs/connections-ui/spec.md` (+)
**Line estimate:** 80
**Depends on:** none
**Acceptance:**
- Spec has 4+ scenarios covering: connection list, create form, edit form, credential rotation, delete with confirmation
- Cross-app contract with `connections` module API referenced (enums from `apps/api/src/database/enums/`)
- Form UX pattern documented (label-above-input, error-below, helper text)
- Entorno column from PR 3c4 referenced for tables
- Drawer/modal patterns from PR 2b referenced

#### T7-01 Update Connections UI
**Description:** Apply new primitives (Cards, Buttons, motion) to Connections.
**Files:**
- `apps/web/src/features/connections/components/ConnectionsStats.tsx` (modified)
- `apps/web/src/features/connections/components/ConnectionsTable.tsx` (modified)
- `apps/web/src/features/connections/components/ConnectionFilters.tsx` (modified)
- `apps/web/src/features/connections/components/ConnectionForm.tsx` (modified)
**Line estimate:** 150
**Depends on:** PR 3
**Acceptance:**
- Visual polish applied

---

### PR 8: feat/ui-cronjobs
**PR total line estimate:** ~180 (includes T8-00 spec, ~80 lines)
**PR status:** ✅ within 400-line budget

#### [x] T8-00 Write cronjobs-ui spec
**Description:** Create `openspec/changes/ui-ux-overhaul/specs/cronjobs-ui/spec.md` documenting Cronjobs UI behavior and scenarios.
**Files:**
- `openspec/changes/ui-ux-overhaul/specs/cronjobs-ui/spec.md` (+) ✅ Created
**Line estimate:** 80
**Depends on:** none
**Acceptance:**
- [x] Spec has 4+ scenarios covering: cronjob list, enable/disable toggle, manual trigger, run history
- [x] Cross-app contract with `jobs` module API referenced
- [x] Toggle/switch motion from emil-design-eng referenced (instant feedback, no transition)
- [x] Status indicator (active/paused/failed) pattern documented
- [x] Filter by environment (Entorno) documented

#### [x] T8-01 Update Cronjobs UI
**Description:** Apply new primitives to Cronjobs.
**Files:**
- `apps/web/src/features/cronjobs/components/*` (modified) ✅ Updated
- `apps/web/src/features/cronjobs/index.tsx` (modified) ✅ Updated
**Line estimate:** 100
**Depends on:** PR 3
**Acceptance:**
- [x] CronjobsStats: Stagger + StaggerItem, variant="outlined" replacing compact
- [x] CronjobFilters: Filters compound (Search, Select, ActiveChips) replacing custom form
- [x] CronjobsTable: DataTable replacing custom Table, composed empty state with Clock icon
- [x] index.tsx: FadeIn wrapper, p-4 sm:p-6 lg:p-8 responsive padding
- [x] Toggle switch: instant feedback (active:scale-[0.97]), no enter/exit animation
- [x] All 137 tests passing (7/7 CronjobsTable tests)
- [x] Typecheck passing (tsc --noEmit)

---

### PR 9: feat/ui-cleanup
**PR total line estimate:** ~180 (includes T9-00 spec, ~80 lines)
**PR status:** ✅ within 400-line budget

#### T9-00 Write cleanup-ui spec
**Description:** Create `openspec/changes/ui-ux-overhaul/specs/cleanup-ui/spec.md` documenting Cleanup UI behavior and scenarios, preserving the prior humanized UX (commit `c62bd7e`).
**Files:**
- `openspec/changes/ui-ux-overhaul/specs/cleanup-ui/spec.md` (+)
**Line estimate:** 80
**Depends on:** none
**Acceptance:**
- Spec has 4+ scenarios covering: cleanup rules list, dry-run preview, apply with confirmation, history
- **MUST preserve** the humanized UX from commit `c62bd7e` (cited explicitly in the spec)
- Cross-app contract with `maintenance` module API referenced
- Destructive action confirmation pattern documented (modal with typed-confirm or hold-to-confirm)
- Toast feedback pattern from emil-design-eng referenced

#### T9-01 Update Cleanup UI
**Description:** Apply new primitives to Cleanup while preserving UX.
**Files:**
- `apps/web/src/features/cleanup/components/*` (modified)
**Line estimate:** 100
**Depends on:** PR 3
**Acceptance:**
- Visual polish applied

---

### PR 10: feat/ui-dashboard
**PR total line estimate:** ~230 (includes T10-00 spec, ~80 lines)
**PR status:** ✅ within 400-line budget

#### T10-00 Write dashboard-ui spec
**Description:** Create `openspec/changes/ui-ux-overhaul/specs/dashboard-ui/spec.md` documenting Dashboard behavior and scenarios. The dashboard is the only place where Sparkline and TrendIndicator from PR 3c3 are used.
**Files:**
- `openspec/changes/ui-ux-overhaul/specs/dashboard-ui/spec.md` (+)
**Line estimate:** 80
**Depends on:** none
**Acceptance:**
- Spec has 4+ scenarios covering: stats overview, time-series chart (Sparkline), trend comparison (TrendIndicator), drill-down to feature pages
- Sparkline/TrendIndicator from PR 3c3 referenced as the canonical implementation
- Chart dark-mode pattern from PR 3c4 referenced (CSS variables for chart colors)
- Stagger entry animation from PR 1 referenced (no scroll-triggered choreography)
- Backward navigation patterns documented

#### T10-01 Update Dashboard UI
**Description:** Apply new primitives and stagger animations to dashboard cards.
**Files:**
- `apps/web/src/features/dashboard/*` (modified)
**Line estimate:** 150
**Depends on:** PR 3
**Acceptance:**
- Dashboard panels FadeIn and Stagger

---

### PR 11: feat/ui-users
**PR total line estimate:** ~280 (includes T11-00 spec, ~80 lines)
**PR status:** ✅ within 400-line budget

#### T11-00 Write users-ui spec
**Description:** Create `openspec/changes/ui-ux-overhaul/specs/users-ui/spec.md` documenting Users UI behavior and scenarios.
**Files:**
- `openspec/changes/ui-ux-overhaul/specs/users-ui/spec.md` (+)
**Line estimate:** 80
**Depends on:** none
**Acceptance:**
- Spec has 4+ scenarios covering: user list with filters, create user, edit user, change password, role assignment
- Better Auth contract referenced (the API source of truth for user/role enums)
- Dialog/sheet patterns from PR 2b referenced (motion entry animations)
- Filters compound pattern from PR 2b referenced (this PR adds filters to users)
- Password input UX (show/hide toggle) documented
- Destructive action confirmation (delete user) documented

#### T11-01 Update Users UI & Add Filters
**Description:** Apply new primitives and add filter compound component.
**Files:**
- `apps/web/src/features/users/components/UsersTable.tsx` (modified)
- `apps/web/src/features/users/components/UserActions.tsx` (modified)
- `apps/web/src/features/users/components/CreateUserDialog.tsx` (modified)
- `apps/web/src/features/users/components/EditUserDialog.tsx` (modified)
- `apps/web/src/features/users/components/ChangePasswordDialog.tsx` (modified)
**Line estimate:** 200
**Depends on:** PR 3
**Acceptance:**
- User views updated with new design

---

### PR 12: feat/ui-login-polish
**PR total line estimate:** ~160 (includes T12-00 spec, ~80 lines)
**PR status:** ✅ within 400-line budget

#### T12-00 Write login spec
**Description:** Create `openspec/changes/ui-ux-overhaul/specs/login/spec.md` documenting LoginPage behavior and visual consistency requirements.
**Files:**
- `openspec/changes/ui-ux-overhaul/specs/login/spec.md` (+)
**Line estimate:** 80
**Depends on:** none
**Acceptance:**
- Spec has 4+ scenarios covering: empty form, validation errors, successful login, failed login
- Better Auth login API contract referenced
- Token storage pattern documented (httpOnly cookie + localStorage strategy)
- Visual consistency with the rest of the app documented (uses same Button, Card, tokens)
- No 3rd-party login providers in scope (out of scope explicitly)
- Accessibility: keyboard nav, focus management, screen reader labels

#### T12-01 Polish LoginPage
**Description:** Replace inline styles with CSS tokens and use standard Button. Add entrance animation.
**Files:**
- `apps/web/src/features/auth/LoginPage.tsx` (modified)
**Line estimate:** 80
**Depends on:** PR 1
**Acceptance:**
- Login page is visually consistent with the rest of the app

---

### PR 13: feat/ui-motion-pass
**PR total line estimate:** ~110 (includes T13-00 spec, ~80 lines)
**PR status:** ✅ within 400-line budget

#### T13-00 Write motion-pass spec
**Description:** Create `openspec/changes/ui-ux-overhaul/specs/motion-pass/spec.md` documenting the final motion pass, a11y audit, and reduced-motion verification scope.
**Files:**
- `openspec/changes/ui-ux-overhaul/specs/motion-pass/spec.md` (+)
**Line estimate:** 80
**Depends on:** none
**Acceptance:**
- Spec has 4+ scenarios covering: page transition timing, reduced-motion compliance, focus management on route change, motion regression detection
- The page transition configuration documented (start/end states, easing, duration)
- `prefers-reduced-motion` overrides enumerated per component
- A11y audit checklist: keyboard nav, focus visible, screen reader labels, color contrast
- Out of scope explicitly: motion on initial load, scroll-triggered animations (per design-taste-frontend dial config)

#### T13-01 Finalize Page Transitions
**Description:** Complete the `AnimatePresence` page transition configuration in Layout.
**Files:**
- `apps/web/src/shared/components/Layout.tsx` (modified)
**Line estimate:** 30
**Depends on:** PR 3, PRs 5-12
**Acceptance:**
- Navigating routes produces a smooth fade+slide transition
- Verified reduced motion compliance across the app

## 3. Dependency Graph

```
PR 1 (Foundation)
  ├─> PR 2a (Shared Basics)
  │      └─> PR 2b (Shared Complex)
  │             └─> PR 3 (Shell)
  │                    ├─> PR 7, 8, 9, 10, 11
  │                    ├─> PR 5, 6 (Also depend on PR 4)
  │                    └─> PR 13 (Depends on all above)
  ├─> PR 4 (Pagination Backend)
  │      ├─> PR 5 (Dumps)
  │      └─> PR 6 (Audit)
  └─> PR 12 (Login Polish)
```
Strict chain rule applies: stacking PRs to main in order.

## 4. Test Strategy Per PR

- **PR 1**: Add 1 unit test for `<FadeIn>` mocking `useReducedMotion`.
- **PR 2a/2b**: Unit tests for new Button `:active` class, Card variants, Pagination logic, and Filter context states.
- **PR 3**: Unit test Topbar breadcrumbs and Sidebar active indicators.
- **PR 4**: Integration tests for paginated `findAll` in `backup.repository.ts` and `audit.repository.ts` (Note: API test framework needs verification).
- **PR 5-11**: E2E or Integration level UI tests for new behaviors. PR 6 specifically tests TanStack Query migration for Audit.
- **PR 12**: Visual inspection for Login.
- **PR 13**: Manual accessibility / reduced-motion audit.

## 5. Risks That Triggered Splits

**PR 2 Split:** The `feat/ui-shared` PR originally bundled button, card, dialog, popover, pagination, and filter updates. This would heavily exceed the 400-line budget. It is split into `2a` (simple primitives: button, card, stat-card, badge) and `2b` (complex interactives: overlays, data-table, pagination, filters) to ensure review focus.

## 6. Risks That Block Progress

None. The split strategy mitigates size risks. Backend testing environment is flagged as needing verification but shouldn't block implementation.

## 7. Estimated Total Time

- PR 1: 1-2 hours
- PR 2a: 1-2 hours
- PR 2b: Half day
- PR 3: Half day
- PR 4: Half day
- PR 5-11: 1-2 hours each (total 2 days)
- PR 12: 1 hour
- PR 13: 1 hour
**Total Effort:** ~4-5 days for one developer.
