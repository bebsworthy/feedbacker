# Phase Plan: Strategic UX Features

status: not_started
phase_key: phase-3-strategic-ux-features
phase_number: 3
last_updated: 2026-03-27

## 1. Task List

| PH ID | Task | Track | Agent | Depends On | Acceptance Criteria | Linked Tests | Status |
| ----- | ---- | ----- | ----- | ---------- | ------------------- | ------------ | ------ |
| PH-001 | Add `FeedbackType`, `BugSeverity` types and optional `type`, `severity`, `elementSelector` fields to `Feedback`, `Draft`, and `ModalState` interfaces in `packages/core/src/types.ts`. Bump `FeedbackStore.version` for forward-compat signaling. | A | build-frontend-developer | -- | New types exported from core. All existing fields unchanged. New fields are `T \| undefined`. Build passes with no type errors across monorepo. | T-062, T-063 | todo |
| PH-002 | Create `getHumanReadableName()` in `packages/detection/src/utils/human-readable-name.ts` with the 6-step resolution chain (aria-label, aria-labelledby, textContent, role, componentName, tagName fallback). Export from `packages/detection/src/index.ts`. | A | build-frontend-developer | -- | Function returns correct name for each priority level. Text truncated to 40 chars with ellipsis. Never returns empty string. Containers with >2 children skip text extraction. | T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008 | todo |
| PH-003 | Create `generateCssSelector()` in `packages/extension/src/utils/css-selector-generator.ts`. Priority: id > data-testid > data-cy/data-test > data-* > nth-child chain. Validate with `querySelector`. Return `null` for extension elements or detached DOM. | A | build-frontend-developer | -- | Returns `#id` for stable IDs. Returns `[data-testid="..."]` when present. Skips UUID-like auto-generated IDs. Returns `null` for extension elements. Generated selector resolves back to original element. | T-045, T-046, T-047, T-048, T-049 | todo |
| PH-004 | Create `relocateElement()` and `highlightElement()` in `packages/extension/src/utils/element-relocator.ts`. `relocateElement` uses `querySelector`. `highlightElement` scrolls into view and shows temporary overlay for 3s. | A | build-frontend-developer | -- | `relocateElement` returns element or null. `highlightElement` calls `scrollIntoView({ behavior: 'smooth', block: 'center' })`. Highlight overlay auto-dismisses after duration. No persistent DOM left behind. | T-041, T-042 | todo |
| PH-005 | Update Markdown exporter (`packages/core/src/export/markdown-exporter.ts`) to prepend `[Type]` or `[Type - Severity]` prefix to headings when `type` is defined. Handle `undefined` gracefully (no prefix). | A | build-frontend-developer | -- | Bug feedback exports with `[Bug]` prefix. Bug+Critical exports with `[Bug - Critical]`. No-type feedback exports identically to pre-phase-3. | T-037, T-038 | todo |
| PH-006 | Update ZIP exporter (`packages/core/src/export/zip-exporter.ts`) to prepend `[Type]` or `[Type - Severity]` prefix to headings when `type` is defined. Handle `undefined` gracefully. | A | build-frontend-developer | -- | Question feedback exports with `[Question]` prefix. Bug+Critical exports with `[Bug - Critical]`. | T-039, T-040 | todo |
| PH-007 | Integrate human-readable names into overlay tooltip, modal header, sidebar card title, and minimized state. Replace raw `info.name`/`info.path` display with `getHumanReadableName()` output. Add technical details toggle to modal (hidden by default) showing component name, path, HTML snippet. | B | build-frontend-developer | PH-001, PH-002 | Tooltip shows human-readable name. Modal header shows human-readable name. Technical details toggle exists and is collapsed by default. Expanding toggle reveals component name, path, snippet. Non-React pages show tag and snippet only (no component path). | T-009, T-010, T-064 | todo |
| PH-008 | Add sidebar search: text input between filter tabs and card list with 300ms debounce. Filter by comment, componentName, URL (case-insensitive). Show "No matching feedback" empty state. Search persists across filter tab switches. | B | build-frontend-developer | PH-001 | Typing filters cards via `.fb-card-hidden` class toggle. Matches comment, element name, and URL. Non-matching search shows empty state message. Tab switch preserves search term. | T-011, T-012, T-013, T-014, T-015, T-065 | todo |
| PH-009 | Add sidebar sort toggle: button in search row. Default newest-first. Toggle switches to oldest-first using `insertBefore` reordering. Resets on sidebar destroy/recreate. | B | build-frontend-developer | PH-008 | Toggle reverses card order. Default is newest-first. New sidebar instance resets to default. Sort uses DOM reordering, not rebuild. | T-016, T-017, T-065 | todo |
| PH-010 | Add DOM hierarchy navigation to `DetectionController`: `setCurrentElement()`, `navigateToParent()`, `navigateToChild()`, `navigateToSibling()`. Skip script/style/extension elements. Wire scroll-wheel events in selection mode with `{ capture: true, passive: false }`. | B | build-frontend-developer | PH-001 | Scroll up navigates to parent, scroll down to child. `navigateToParent` on `<html>` returns null. Extension elements are skipped. `onHover` called with new element's ComponentInfo. Page does not scroll during selection. Wheel listener removed on deactivation. | T-018, T-019, T-020, T-021, T-022, T-023, T-066 | todo |
| PH-011 | Create `BreadcrumbTrail` component (`packages/extension/src/ui/breadcrumb-trail.ts`). Renders ancestor chain for current element, max 6 segments with ellipsis truncation. Last segment visually distinguished. Updates on navigation. Created in `activate()`, removed in `deactivate()`. | B | build-frontend-developer | PH-010 | Breadcrumb shows correct segment count. Segments truncated with ellipsis beyond 6. Last segment is bold/distinguished. Updates on parent/child navigation. DOM element removed on deactivation. | T-024, T-025, T-026, T-066 | todo |
| PH-012 | Add type categorization chips to modal: Suggestion (default), Bug, Question. Implement chip bar with radio-group semantics. Bug selection reveals severity sub-control (Critical/Major/Minor, no default). Switching away from Bug clears severity. Wire `onSubmit`/`onDraftSave` to pass type and severity. | C | build-frontend-developer | PH-001, PH-007 | Suggestion chip selected by default. Clicking Bug shows severity control. Switching from Bug clears severity. Submit passes correct type/severity. Chip keyboard navigation with Arrow Left/Right and Space/Enter. Focus wraps at edges. | T-027, T-028, T-029, T-030, T-031, T-032, T-033, T-059, T-060, T-061, T-067 | todo |
| PH-013 | Add type badges to sidebar cards. Red badge for Bug, blue for Suggestion, purple for Question. No badge for `undefined` type (pre-existing feedback). | C | build-frontend-developer | PH-001, PH-008 | Bug shows red badge. Suggestion shows blue badge. Pre-existing feedback (no type) renders without badge and without errors. | T-034, T-035, T-036 | todo |
| PH-014 | Integrate CSS selector generation into feedback capture flow (`app.ts`). Call `generateCssSelector()` on the selected element and store result as `elementSelector` on the `Feedback` object. | C | build-frontend-developer | PH-001, PH-003 | Captured feedback includes `elementSelector` when selector generation succeeds. `elementSelector` is `undefined` when generation fails. No errors thrown on failure. | T-045, T-049 | todo |
| PH-015 | Add navigate-to-element (locate icon) to sidebar cards. Show locate icon only for same-origin cards with `elementSelector`. On click: relocate element, scroll, highlight 3s. Toast on not-found. Sidebar stays open during highlight. Wire `onLocateElement` callback and `currentOrigin` in `SidebarOptions`. | C | build-frontend-developer | PH-001, PH-004, PH-008, PH-014 | Locate icon shown only for same-origin cards with selector. Click scrolls to element and highlights. Not-found shows toast. Cross-origin cards have no locate icon. Sidebar remains open. | T-041, T-042, T-043, T-044, T-068 | todo |
| PH-016 | Add keyboard selection to `DetectionController`: Tab/Shift+Tab cycles focusable elements, Arrow Up/Down navigates DOM hierarchy (reuse PH-010 methods), Enter confirms selection, Escape exits. ARIA live region for "no focusable elements" announcement. All keydown listeners registered in `activate()`, removed in `deactivate()`. `preventDefault`/`stopPropagation` on Enter. | C | build-frontend-developer | PH-010 | Tab moves focus to next focusable element and updates overlay. Shift+Tab moves backward. Arrow Up/Down navigate parent/child. Enter confirms and opens modal. Escape exits selection mode. No focusable elements shows ARIA announcement. Enter does not trigger page form submission. | T-050, T-051, T-052, T-053, T-054, T-055, T-056, T-057, T-058, T-069 | todo |
| PH-017 | Backward compatibility verification: write tests confirming pre-phase-3 feedback (no type, severity, elementSelector) renders in sidebar without errors, exports unchanged in Markdown and ZIP formats, and shows no badge or locate icon. | D | build-frontend-developer | PH-013, PH-015, PH-005, PH-006 | Pre-existing feedback renders without badge, without locate icon, without errors. Export output identical to pre-phase-3 format. | T-062, T-063, T-070 | todo |
| PH-018 | Write and pass all E2E tests: human-readable names flow (T-064), search/sort flow (T-065), scroll-wheel granularity flow (T-066), type categorization flow (T-067), navigate-to-element flow (T-068), keyboard selection flow (T-069), backward compatibility flow (T-070). | D | build-frontend-developer | PH-007, PH-009, PH-011, PH-012, PH-015, PH-016, PH-017 | All 7 E2E test files pass. Full keyboard-only flow completes. Backward compat flow passes. | T-064, T-065, T-066, T-067, T-068, T-069, T-070 | todo |

## 2. Implementation Log

| Date | Change | Files | Notes |
| ---- | ------ | ----- | ----- |

## 3. Verification

### 3.1 Commands Run

### 3.2 Results

### 3.3 Documentation Drift Reconciliation

## 4. Test Plan Closure

| T ID | Final Status | Evidence | Notes |
| ---- | ------------ | -------- | ----- |

## 5. Completion Decision

- Phase status:
- Exit criteria: all items from SKILL.md Definition of Done

---

Instructions: See SKILL.md Step 5-7 for authoring rules. Task statuses: todo|in_progress|done|descoped. Track groups independent tasks for parallel execution (A, B, C). Agent suggests best-suited tech agent (e.g., build-frontend-developer, build-backend-developer). Both Track and Agent are optional. Run verify-traceability before advancing.
