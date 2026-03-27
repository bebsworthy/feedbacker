# Phase Plan: Fix Critical UX Issues

status: not_started
phase_key: phase-1-fix-critical-ux-issues
phase_number: 1
last_updated: 2026-03-27

## 1. Task List

| PH ID | Task | Track | Agent | Depends On | Acceptance Criteria | Linked Tests | Status |
| ----- | ---- | ----- | ----- | ---------- | ------------------- | ------------ | ------ |
| PH-001 | CSS foundation: focus-visible, contrast, reduced-motion, toast/coach-mark/draft-indicator styles, screenshot-copy visibility | A | build-frontend-developer | -- | (1) `:focus-visible` rules exist for `.fb-btn`, `.fb-btn-icon`, `.fb-fab`, `.fb-fab-action`, `.fb-export-option` using `box-shadow`. (2) Light `--fb-text-muted` is `#6b7280`, dark is `#d1d5db`. (3) `@media (prefers-reduced-motion: reduce)` block sets `transition-duration: 0s !important` and `animation-duration: 0s !important`. (4) `.fb-submit-hint`, `.fb-draft-saved`, `.fb-toast`, `.fb-toast-in`, `.fb-badge-bump`, `.fb-coach-mark`, `.fb-fab-pulse` CSS classes added. (5) `.fb-screenshot-copy` default opacity is `0.85`, no `opacity: 0` default, hover-only reveal removed. (6) `.fb-btn-danger` style exists or is reused. | T-014, T-020, T-021, T-022, T-026 | todo |
| PH-002 | Modal: reverse Enter/Cmd+Enter, ARIA attrs, submit hint, draft indicator, aria-label on textarea, icon-button labels | A | build-frontend-developer | -- | (1) Plain Enter inserts newline (does not submit). (2) Cmd+Enter and Ctrl+Enter submit when textarea has content. (3) Submit hint shows OS-appropriate `Cmd+Enter` or `Ctrl+Enter`. (4) `textarea` has `aria-label="Feedback description"`. (5) Modal element has `role="dialog"`, `aria-modal="true"`, `aria-label` containing component name. (6) Path element text starts with `"Element location:"`. (7) Draft saved indicator shows after auto-save and fades. (8) Minimize and close buttons have `aria-label`. | T-004, T-005, T-006, T-007, T-008, T-010, T-013, T-015 | todo |
| PH-003 | FAB: rename labels, remove Clear All, ARIA attrs, tooltip with shortcut | A | build-frontend-developer | -- | (1) Menu shows "View feedback (N)" and "Share / Export"; no "Clear all" or "Show manager". (2) `onClearAll` removed from `FABOptions`. (3) `aria-label="Feedbacker menu"` and `aria-expanded` toggle on expand/collapse. (4) Badge has `aria-label` containing "feedback items", updated on count change. (5) `button.title` contains keyboard shortcut with OS-aware modifier. | T-001, T-012, T-017, T-030 | todo |
| PH-004 | Sidebar: rename copy tooltip, add Clear All to footer, ARIA roles on sidebar and filter tabs, icon-button labels | A | build-frontend-developer | -- | (1) Copy button tooltip is "Copy to clipboard", not "Copy markdown". (2) Footer has "Clear all" button with `fb-btn-danger` class; hidden when 0 items. (3) Clicking Clear All calls `onClearAll`. (4) Sidebar has `role="complementary"` and `aria-label="Feedback manager"`. (5) Filter bar has `role="tablist"`, tabs have `role="tab"`, active tab has `aria-selected="true"`. (6) Edit, copy, delete, screenshot-copy buttons have `aria-label`. (7) Close button has `aria-label="Close sidebar"`. | T-002, T-009, T-016, T-018, T-024 | todo |
| PH-005 | Export dialog: rename ZIP description, ARIA attrs | A | build-frontend-developer | -- | (1) ZIP description is "Full report with screenshots". (2) Modal has `role="dialog"`, `aria-modal="true"`, `aria-label` containing item count. (3) Close button has `aria-label`. | T-003, T-029 | todo |
| PH-006 | Minimized state: increase discard button target size | A | build-frontend-developer | -- | (1) Discard button has `min-width: 24px` and `min-height: 24px`. (2) Button has `aria-label="Discard draft"`. | T-025 | todo |
| PH-007 | Popup: keyboard shortcut display and privacy trust signal | A | build-frontend-developer | -- | (1) Popup shows OS-aware shortcut text containing "Shift+F". (2) Privacy notice with text "Your feedback stays local" is present. | T-011, T-023 | todo |
| PH-008 | App: ARIA live region, toast, coach mark, wire Clear All to sidebar | B | build-frontend-developer | PH-001, PH-003, PH-004 | (1) Visually-hidden live region with `role="status"` and `aria-live="polite"` exists. (2) `announce()` called after submit ("Feedback saved"), copy ("Copied to clipboard"), delete ("Feedback deleted"), clear all ("All feedback deleted"). (3) `showToast("Feedback saved!")` fires after successful submit; toast has `role="status"`, auto-removes after 3500ms. (4) Coach mark shows on first use (storage empty/error), dismissed on click or 8s timeout, sets `feedbacker-onboarding-shown: true`. (5) Coach mark does not appear when storage flag is `true`. (6) `onClearAll` wired from app to sidebar via `SidebarOptions`. (7) `onAnnounce` wired from sidebar to app for copy/delete announcements. | T-019, T-027, T-028 | todo |
| PH-009 | Confirm dialog: ARIA attrs | A | build-frontend-developer | -- | (1) Dialog element has `role="dialog"`, `aria-modal="true"`, `aria-label` set to dialog title. | -- | todo |
| PH-010 | Unit tests: modal, fab, sidebar, export-dialog, styles, minimized-state, popup, app | C | build-frontend-developer | PH-001, PH-002, PH-003, PH-004, PH-005, PH-006, PH-007, PH-008, PH-009 | (1) All tests T-001 through T-030 pass. (2) `npm run test` exits 0 in `packages/extension`. (3) No regressions in existing tests. | T-001 through T-030 | todo |
| PH-011 | E2E tests: capture-submit, onboarding, keyboard-a11y, clear-all, popup, visual-a11y flows | D | build-frontend-developer | PH-010 | (1) All tests T-E01 through T-E06 pass. (2) Existing `extension-flow.spec.ts` still passes. (3) `npm run test:e2e` exits 0. | T-E01 through T-E06 | todo |

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

- Phase status: not_started
- Exit criteria: all items from SKILL.md Definition of Done

---

### Track Summary

**Track A (PH-001 through PH-007, PH-009) -- Foundation: Component edits and CSS**
No inter-dependencies. All tasks modify separate files and can be implemented in parallel. PH-001 handles the shared stylesheet; PH-002 through PH-007 and PH-009 handle individual UI component files and the popup.

**Track B (PH-008) -- App integration: wiring toast, coach mark, live region, Clear All**
Depends on Track A completing PH-001 (CSS for toast/coach-mark), PH-003 (FAB Clear All removal), and PH-004 (sidebar Clear All addition). This task connects the new micro-components and cross-component callbacks in `app.ts`.

**Track C (PH-010) -- Unit tests**
Depends on all implementation tasks (Tracks A and B). Writes unit tests T-001 through T-030 verifying every functional change.

**Track D (PH-011) -- E2E tests**
Depends on unit tests passing. Writes E2E flows T-E01 through T-E06 validating integrated behavior in a real browser.
