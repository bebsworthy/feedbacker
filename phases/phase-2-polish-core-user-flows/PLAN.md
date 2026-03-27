# Phase Plan: Polish Core User Flows

status: not_started
phase_key: phase-2-polish-core-user-flows
phase_number: 2
last_updated: 2026-03-27

## 1. Task List

| PH ID | Task | Track | Agent | Depends On | Acceptance Criteria | Linked Tests | Status |
| ----- | ---- | ----- | ----- | ---------- | ------------------- | ------------ | ------ |
| PH-001 | Add new SVG icons: `emptyStateIllustration(size)` (64px clipboard-with-plus) and `clipboardCopyIcon(size)` to `ui/icons.ts` | A | build-frontend-developer | -- | (1) `emptyStateIllustration()` returns an SVG string with class `fb-empty-illustration` at 64px default. (2) `clipboardCopyIcon()` returns an SVG string suitable for export dialog option. (3) Both functions accept optional `size` parameter. | -- | todo |
| PH-002 | Add CSS: larger card action icons (32x32 target), card actions gap | A | build-frontend-developer | -- | (1) `.fb-btn-icon` padding is `8px` (up from 6px), yielding 32x32 touch target with 16px icon. (2) `.fb-card-actions` gap is `8px`. | T-011 | todo |
| PH-003 | Add CSS: entrance/exit animation keyframes and animation assignments | A | build-frontend-developer | -- | (1) `@keyframes fb-sidebar-in` animates `translateX(100%)` to `translateX(0)`. (2) `@keyframes fb-modal-in` animates `translateY(12px) opacity(0)` to final state. (3) `@keyframes fb-fab-cascade` animates `translateY(8px) opacity(0)` to final. (4) `.fb-sidebar` has `animation: fb-sidebar-in 200ms ease-out`. (5) `.fb-modal` has `animation: fb-modal-in 200ms ease-out`. (6) `.fb-fab-action` uses `fb-fab-cascade` with 50ms stagger per nth-child. (7) Existing `prefers-reduced-motion` rule already suppresses these. | T-015, T-016, T-017 | todo |
| PH-004 | Add CSS: undo toast styles, empty state redesign, inline edit textarea, saved indicator, milestone badge, selection banner, remove sidebar footer styles | A | build-frontend-developer | -- | (1) `.fb-toast-undo` has left border accent with error color and undo button. (2) `.fb-empty` is flex-column centered with illustration, heading, subtext, CTA layout. (3) `.fb-inline-edit-textarea` is styled textarea, min-height 60px. (4) `.fb-saved-indicator` shows green "Saved" text with fade. (5) `.fb-milestone` has subtle pulse background. (6) `.fb-selection-banner` has fixed top, full-width, high z-index. (7) `.fb-sidebar-footer` styles are removed. | T-009, T-011 | todo |
| PH-005 | Add lifecycle callbacks to `DetectionController`: `setLifecycleCallbacks(onActivate, onDeactivate)` | A | build-frontend-developer | -- | (1) `setLifecycleCallbacks` method exists accepting `onActivate` and `onDeactivate` functions. (2) `onActivate` is called when detection mode activates. (3) `onDeactivate` is called when detection mode deactivates (element selected or Escape pressed). | T-012, T-013, T-014 | todo |
| PH-006 | Update `ExportDialog`: add "Copy all to clipboard" as first option, rename header to "Share / Export", add `onCopyAll` callback to `ExportDialogOptions` | B | build-frontend-developer | PH-001 | (1) Dialog renders three options: Copy all (first), Markdown, ZIP. (2) Copy all option uses `clipboardCopyIcon`. (3) Header reads "Share / Export N items". (4) Clicking Copy all invokes `opts.onCopyAll`. | T-018, T-028 | todo |
| PH-007 | Update `ManagerSidebar`: remove footer, add "Share / Export" header button, redesign empty state with SVG + CTA, add `onStartCapture` and `onShowExportDialog` callbacks | B | build-frontend-developer | PH-001, PH-004 | (1) No `.fb-sidebar-footer` element rendered. (2) Header contains "Share / Export" button that calls `opts.onShowExportDialog`. (3) Empty state (zero feedbacks) renders `.fb-empty` with SVG illustration, "No feedback yet" heading, subtext, and "Start reviewing" CTA button. (4) CTA click calls `opts.onStartCapture` and `opts.onClose`. (5) `SidebarOptions` interface updated per spec (removed `onEdit`, `onExport`, `onClearAll`; added `onSaveEdit`, `onShowExportDialog`, `onStartCapture`). | T-009, T-010, T-027 | todo |
| PH-008 | Add inline card editing to `ManagerSidebar`: edit icon activates textarea, blur saves with debounce, Escape cancels with flag pattern | C | build-frontend-developer | PH-007 | (1) Clicking pencil icon replaces `.fb-card-comment` with textarea prefilled with existing comment. (2) Textarea receives focus. (3) Only one card editable at a time; starting edit on card B saves and closes card A. (4) On blur, `onSaveEdit` called after 1000ms debounce with updated comment; "Saved" indicator appears; textarea reverts to text. (5) If `onSaveEdit` rejects, textarea stays in edit mode and error indicator appears. (6) On Escape, `editCancelled` flag set, original text restored, `onSaveEdit` NOT called. (7) Escape in edit mode does NOT close sidebar (`e.stopPropagation()`). | T-021, T-022, T-023, T-024, T-025, T-026 | todo |
| PH-009 | Implement undo delete in `FeedbackApp`: `showUndoToast`, `pendingDelete` state, 8s timer, priority override, error recovery | D | build-frontend-developer | PH-005, PH-007 | (1) Delete hides card from sidebar and shows `.fb-toast-undo` with "Feedback deleted" text and Undo button. (2) `state.deleteFeedback` NOT called immediately. (3) After 8s, `state.deleteFeedback(id)` called and toast dismissed. (4) Clicking Undo restores card at original position, cancels timer, removes toast. (5) Second delete within 8s finalizes previous pending delete immediately. (6) If `state.deleteFeedback` rejects, error toast shown and card restored. (7) Undo toast overrides any active informational toast. | T-001, T-002, T-003, T-004, T-005 | todo |
| PH-010 | Implement export success toasts and copy-all in `FeedbackApp`: wire `onCopyAll`, export toasts, clipboard write, error handling | D | build-frontend-developer | PH-006, PH-007 | (1) Markdown export shows "Report downloaded" toast that auto-dismisses at 3500ms. (2) ZIP export shows "Report downloaded" toast. (3) Export failure shows "Export failed. Please try again." error toast. (4) Copy all serializes filtered items to Markdown, calls `navigator.clipboard.writeText`, shows "Copied N items to clipboard" toast. (5) Clipboard failure shows "Failed to copy. Please try again." error toast. (6) `onShowExportDialog` from sidebar opens ExportDialog. | T-006, T-007, T-008, T-019, T-020 | todo |
| PH-011 | Implement selection banner in `FeedbackApp`: show/dismiss banner on `document.body` via DetectionController lifecycle callbacks | D | build-frontend-developer | PH-005, PH-004 | (1) When detection activates, banner element with `role="status"` appears on `document.body` at viewport top. (2) Banner text: "Click on any element to capture feedback. Press Esc to cancel." (3) Banner dismisses on element click (via `onComponentSelect`). (4) Banner dismisses on Escape (via `onDeactivate`). (5) Banner uses high z-index and inline styles per ADR-P2-003. | T-012, T-013, T-014 | todo |
| PH-012 | Implement toast message rotation and milestone celebrations in `FeedbackApp` | D | build-frontend-developer | PH-007 | (1) Submit toast rotates through messages: "Feedback saved!", "Got it!", "Captured!", "Nice catch!" using `toastMessageIndex` counter. (2) Consecutive submissions show different messages. (3) At feedback count 5, milestone text "Thorough review!" appears in sidebar header. (4) At count 10, "Detailed review!" appears. (5) Milestone uses `.fb-milestone` styling. | T-029, T-030, T-031 | todo |
| PH-013 | Unit tests for `app.test.ts`: undo delete (T-001..T-005), export toasts (T-006..T-008), selection banner (T-012..T-014), copy all (T-019, T-020), milestones (T-029..T-031) | E | build-frontend-developer | PH-009, PH-010, PH-011, PH-012 | (1) All 19 test cases in `app.test.ts` pass. (2) Tests use `jest.useFakeTimers` for 8s undo timeout. (3) Tests mock `navigator.clipboard.writeText` for copy-all. (4) Tests verify DOM state for banner, toast, and milestone elements. | T-001, T-002, T-003, T-004, T-005, T-006, T-007, T-008, T-012, T-013, T-014, T-019, T-020, T-029, T-030, T-031 | todo |
| PH-014 | Unit tests for `sidebar.test.ts`: empty state (T-009, T-010), inline edit (T-021..T-026), header/footer (T-027) | E | build-frontend-developer | PH-008 | (1) All 9 test cases in `sidebar.test.ts` pass. (2) Tests verify empty state DOM structure and CTA callback. (3) Tests verify inline edit lifecycle: activate, blur-save, Escape-cancel, single-edit constraint. (4) Tests verify footer removed and header export button present. | T-009, T-010, T-021, T-022, T-023, T-024, T-025, T-026, T-027 | todo |
| PH-015 | Unit tests for `extension-css.test.ts`: icon sizing (T-011), animations (T-015..T-017) | E | build-frontend-developer | PH-002, PH-003 | (1) All 4 test cases pass. (2) CSS string assertions verify padding, gap, keyframe definitions, animation assignments, and reduced-motion media query. | T-011, T-015, T-016, T-017 | todo |
| PH-016 | Unit tests for `export-dialog.test.ts`: copy-all option (T-018), header text (T-028) | E | build-frontend-developer | PH-006 | (1) Both test cases pass. (2) Verifies copy-all is first option with clipboard icon. (3) Verifies header text is "Share / Export N items". | T-018, T-028 | todo |
| PH-017 | E2E tests: delete-undo flow (T-032), export flow (T-033), empty-state-capture flow (T-034), inline-edit flow (T-035), animations flow (T-036), milestones flow (T-037) | F | build-frontend-developer | PH-013, PH-014, PH-015, PH-016 | (1) All 6 E2E specs pass via `npx playwright test`. (2) Each spec covers the full user flow as described in test plan. (3) T-036 verifies both normal animation and reduced-motion instant rendering. | T-032, T-033, T-034, T-035, T-036, T-037 | todo |

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
| T-001 | not_started | | |
| T-002 | not_started | | |
| T-003 | not_started | | |
| T-004 | not_started | | |
| T-005 | not_started | | |
| T-006 | not_started | | |
| T-007 | not_started | | |
| T-008 | not_started | | |
| T-009 | not_started | | |
| T-010 | not_started | | |
| T-011 | not_started | | |
| T-012 | not_started | | |
| T-013 | not_started | | |
| T-014 | not_started | | |
| T-015 | not_started | | |
| T-016 | not_started | | |
| T-017 | not_started | | |
| T-018 | not_started | | |
| T-019 | not_started | | |
| T-020 | not_started | | |
| T-021 | not_started | | |
| T-022 | not_started | | |
| T-023 | not_started | | |
| T-024 | not_started | | |
| T-025 | not_started | | |
| T-026 | not_started | | |
| T-027 | not_started | | |
| T-028 | not_started | | |
| T-029 | not_started | | |
| T-030 | not_started | | |
| T-031 | not_started | | |
| T-032 | not_started | | |
| T-033 | not_started | | |
| T-034 | not_started | | |
| T-035 | not_started | | |
| T-036 | not_started | | |
| T-037 | not_started | | |

## 5. Completion Decision

- Phase status: not_started
- Exit criteria: all items from SKILL.md Definition of Done
