# Phase Spec: Polish Core User Flows

status: not_started
phase_key: phase-2-polish-core-user-flows
phase_number: 2
last_updated: 2026-03-27

## 1. Inputs and Traceability

| Source | Artifact | Key Inputs |
| ------ | -------- | ---------- |
| BRD | `phases/phase-2-polish-core-user-flows/BRD.md` | 15 FCs (FC-001 through FC-015), 12 ACs, 6 E2E flows, 10 deliverables |
| RESEARCH | `phases/phase-2-polish-core-user-flows/RESEARCH.md` | 8 technical findings (TR-001..TR-008), 5 resolved questions |
| Architecture Ref | `phases/research/architecture-reference.md` | Shadow DOM pattern, toast system, UI component pattern, state management |
| Phase 1 Delivery | Commits `8fc0b2f`, `f83042c` | Toast infrastructure (`showToast`), coach mark, `prefers-reduced-motion` blanket rule, focus traps, event isolation |

## 2. Technical Plan

### 2.1 Architecture and Module Boundaries

**Module change map:**

| Module | Changes | Rationale |
| ------ | ------- | --------- |
| `ui/app.ts` (FeedbackApp) | Upgrade `showToast` to support undo variant with action button + 8s timeout. Add `pendingDelete` state. Add export success toasts. Add milestone toast rotation. Add selection banner lifecycle. Wire sidebar `onExport` to open ExportDialog. | FeedbackApp is the controller that owns toast, deletion, export, and selection mode coordination (TR-001, TR-003, TR-008). |
| `ui/sidebar.ts` (ManagerSidebar) | Remove footer export buttons. Add "Share / Export" button to header. Redesign empty state with SVG + CTA. Add inline edit mode (textarea on card). Remove `onEdit` modal-based callback. Add `onStartCapture` callback for empty state CTA. | Sidebar owns card rendering and needs stateful edit mode (TR-004, TR-006, TR-007). |
| `ui/export-dialog.ts` (ExportDialog) | Add "Copy all to clipboard" as first option. Rename dialog header to "Share / Export". Add `onCopyAll` callback. | TR-007: unified export surface needs clipboard option. |
| `ui/icons.ts` | Add `emptyStateIllustration(size)` function returning a 64px clipboard-with-plus SVG. Add `clipboardCopyIcon(size)` for the copy-all export option. | TR-006: empty state needs purpose-built illustration; existing icons designed for 16-20px. |
| `styles/extension-css.ts` | Increase `.fb-btn-icon` padding to 8px (32x32 target). Increase `.fb-card-actions` gap to 8px. Add `@keyframes` for sidebar-in, modal-in, fab-cascade. Add undo toast styles (`.fb-toast-undo`). Add selection banner styles. Add empty state redesign styles. Add inline edit styles. Add milestone styles. Remove `.fb-sidebar-footer` styles (footer removed). | TR-003, TR-005: CSS-only changes for animations and sizing. |
| `core/detection-controller.ts` | Add `onActivate` / `onDeactivate` callbacks for banner lifecycle. | TR-003: selection banner lifecycle is tied to DetectionController state transitions. |
| `ui/overlay.ts` | No changes. Selection banner is a separate DOM element, not part of overlay. | Banner renders on `document.body` but is managed by FeedbackApp, not overlay. |

**Key architectural decisions:**

1. **Undo delete is a UI-layer concern, not a StateManager change (TR-001).** On delete: hide card from UI, start 8s timer. On timeout: call `state.deleteFeedback()`. On undo: restore card visibility. `StateManager` remains unchanged.

2. **Toast priority override, not stacking (Q-001 resolved).** Undo toast replaces any active informational toast. Both occupy the same `.fb-toast` slot. Undo toast uses class `.fb-toast-undo` for distinct styling (error-tinted border, undo button). This maintains the existing single-toast design.

3. **Selection banner renders on `document.body`, not in shadow DOM.** Like `ComponentOverlayUI`, the banner must be visible at viewport top during selection mode. It renders outside the shadow DOM with inline styles and high z-index. Lifecycle is managed by `FeedbackApp` via new `DetectionController` activation callbacks.

4. **Inline edit uses cancel-flag pattern for blur vs Escape (Q-002 resolved).** When Escape is pressed during edit, set `this.editCancelled = true` and revert. The blur handler checks this flag before saving. Escape on the textarea also calls `e.stopPropagation()` to prevent sidebar close.

5. **Footer removed entirely (Q-005 resolved).** Phase 1 already demoted "Clear all" from FAB menu. Sidebar footer with export buttons is replaced by a "Share / Export" button in the header. "Clear all" remains accessible only via FAB menu.

6. **Text-only milestones, no confetti (Q-004 resolved).** Milestone messages at counts 5 and 10 display in the sidebar header with a subtle background color pulse. Toast message rotation uses a simple index counter on `FeedbackApp` (no persistence needed).

### 2.2 Data Model and Migrations

No data model changes. The `Feedback` type and `chrome.storage.local` schema remain unchanged. All Phase 2 changes are UI-layer: deferred deletion, inline editing, toast enhancements, and CSS animations.

**Transient UI state (not persisted):**

| State | Type | Location | Purpose |
| ----- | ---- | -------- | ------- |
| `pendingDelete` | `{ id: string, feedback: Feedback, timer: number, position: number } \| null` | `FeedbackApp` | Tracks the item awaiting permanent deletion during 8s undo window |
| `editingCardId` | `string \| null` | `ManagerSidebar` | ID of the card currently in inline edit mode |
| `editCancelled` | `boolean` | `ManagerSidebar` | Flag checked by blur handler to skip save when Escape was pressed |
| `editDebounceTimer` | `number \| null` | `ManagerSidebar` | Debounce timer for auto-save during inline editing |
| `toastMessageIndex` | `number` | `FeedbackApp` | Rotating index for varied success messages |
| `selectionBanner` | `HTMLDivElement \| null` | `FeedbackApp` | Reference to the banner element on `document.body` |

### 2.3 API Contracts and Error Semantics

No backend APIs. All operations are client-side. Contract changes are between UI classes via callback interfaces.

**SidebarOptions interface changes:**

```typescript
interface SidebarOptions {
  feedbacks: Feedback[];
  onClose: () => void;
  onDelete: (id: string) => void;
  // REMOVED: onEdit: (feedback: Feedback) => void;
  // ADDED: inline edit saves directly via onSaveEdit
  onSaveEdit: (id: string, comment: string) => Promise<void>;
  // REMOVED: onExport: (format: 'markdown' | 'zip') => void;
  // ADDED: opens the unified ExportDialog
  onShowExportDialog: () => void;
  // REMOVED: onClearAll: () => void;  (access via FAB only)
  onStartCapture: () => void;  // NEW: empty state CTA
  onAnnounce?: (message: string) => void;
}
```

**ExportDialogOptions interface changes:**

```typescript
interface ExportDialogOptions {
  feedbackCount: number;
  onExport: (format: 'markdown' | 'zip') => void;
  onCopyAll: () => void;  // NEW: clipboard copy of all filtered items
  onCancel: () => void;
}
```

**DetectionController callback additions:**

```typescript
// New optional callbacks on DetectionController
setLifecycleCallbacks(
  onActivate: () => void,
  onDeactivate: () => void
): void;
```

**FeedbackApp.showToast upgrade:**

```typescript
// Current signature (unchanged for basic toasts)
private showToast(message: string): void;

// New overload for undo toasts
private showUndoToast(
  message: string,
  onUndo: () => void,
  timeoutMs?: number  // default 8000
): void;
```

**Error handling contracts:**

| Operation | Error Condition | Response |
| --------- | --------------- | -------- |
| Undo delete timeout -> `state.deleteFeedback()` | Storage write fails | Show error toast "Failed to delete. Item restored." Restore card to its position. |
| Inline edit save -> `state.addFeedback(updated)` | Storage write fails | Show error toast "Failed to save. Please try again." Keep textarea in edit mode. |
| Copy all -> `navigator.clipboard.writeText()` | Clipboard API fails | Show error toast "Failed to copy. Please try again." Keep dialog open. |
| Markdown/ZIP export | Export generation throws | Show error toast "Export failed. Please try again." instead of success toast. |

### 2.4 Auth/Authz Constraints

No auth changes. The extension operates entirely client-side with `chrome.storage.local`. Clipboard API is always available in Chrome extension secure contexts (TR-002). No new permissions required in `manifest.json`.

### 2.5 Observability and Reliability

**Logging (via existing `logger` from `@feedbacker/core`):**

| Event | Level | Message |
| ----- | ----- | ------- |
| Undo delete initiated | `debug` | `Pending delete: {id}, 8s timeout started` |
| Undo delete completed | `debug` | `Delete finalized: {id}` |
| Undo restore | `debug` | `Delete undone: {id}` |
| Delete finalization failed | `error` | `Failed to finalize delete: {id}` |
| Inline edit saved | `debug` | `Inline edit saved: {id}` |
| Inline edit save failed | `error` | `Failed to save inline edit: {id}` |
| Copy all to clipboard | `debug` | `Copied {n} items to clipboard` |
| Clipboard write failed | `warn` | `Clipboard write failed` |
| Milestone reached | `debug` | `Milestone reached: {count} items` |
| Selection banner shown | `debug` | `Selection banner displayed` |
| Selection banner dismissed | `debug` | `Selection banner dismissed` |

**No metrics or alerts.** The extension has no telemetry infrastructure. Reliability is ensured via error toasts that surface failures to the user and allow retry.

**Reduced motion compliance.** The existing `@media (prefers-reduced-motion: reduce)` blanket rule in `extension-css.ts` (lines 551-560) already suppresses all animations with `animation-duration: 0s !important` and `transition-duration: 0s !important`. New animations automatically inherit this suppression. No additional work needed for FC-009's reduced-motion requirement.

## 3. Test Plan

| T ID | Linked FC | Level | Target File | Scenario | Assertions | Status |
| ---- | --------- | ----- | ----------- | -------- | ---------- | ------ |
| T-001 | FC-001 | unit | `__tests__/app.test.ts` | Delete card shows undo toast and defers storage deletion | (1) Card is visually removed from sidebar. (2) `.fb-toast-undo` element exists with `role="status"`. (3) Toast text includes "Feedback deleted" and "Undo" button. (4) `state.deleteFeedback` is NOT called immediately. | not_started |
| T-002 | FC-001 | unit | `__tests__/app.test.ts` | Undo toast auto-dismisses and finalizes delete after 8 seconds | (1) After 8000ms (faked via `jest.advanceTimersByTime`), `state.deleteFeedback(id)` is called. (2) Toast element is removed from DOM. (3) `fab.updateCount` is called with decremented count. | not_started |
| T-003 | FC-001 | unit | `__tests__/app.test.ts` | Second delete finalizes previous pending delete | (1) Delete card A, then delete card B within 8s. (2) `state.deleteFeedback(A.id)` is called immediately on second delete. (3) Only card B has active undo toast. | not_started |
| T-004 | FC-001 | unit | `__tests__/app.test.ts` | Delete finalization failure restores card | (1) `state.deleteFeedback` rejects. (2) Error toast "Failed to delete. Item restored." appears. (3) Card is restored to sidebar. | not_started |
| T-005 | FC-002 | unit | `__tests__/app.test.ts` | Clicking Undo restores card and cancels deletion | (1) Click Undo button on toast. (2) Card reappears at original position in sidebar. (3) Toast is removed. (4) `state.deleteFeedback` is never called. (5) `fab.updateCount` is called with original count. | not_started |
| T-006 | FC-003 | unit | `__tests__/app.test.ts` | Markdown export shows success toast | (1) Call `doExport('markdown')`. (2) Toast appears with text "Report downloaded". (3) Toast auto-dismisses after 3500ms. | not_started |
| T-007 | FC-003 | unit | `__tests__/app.test.ts` | ZIP export shows success toast | (1) Call `doExport('zip')`. (2) Toast appears with text "Report downloaded". | not_started |
| T-008 | FC-003 | unit | `__tests__/app.test.ts` | Export failure shows error toast | (1) `MarkdownExporter.downloadMarkdown` throws. (2) Toast appears with text "Export failed. Please try again." (3) No success toast is shown. | not_started |
| T-009 | FC-004 | unit | `__tests__/sidebar.test.ts` | Empty state shows designed layout | (1) Render sidebar with zero feedbacks for current site. (2) `.fb-empty` container exists. (3) Contains SVG element (`.fb-empty-illustration`). (4) Contains heading "No feedback yet". (5) Contains subtext "Click 'New feedback' to start your review". (6) Contains "Start reviewing" button with class `fb-btn fb-btn-primary`. | not_started |
| T-010 | FC-005 | unit | `__tests__/sidebar.test.ts` | Empty state CTA triggers capture flow | (1) Click "Start reviewing" button. (2) `opts.onStartCapture` callback is called. (3) Sidebar `onClose` is called (sidebar should close). | not_started |
| T-011 | FC-006 | unit | `__tests__/extension-css.test.ts` | Card action icons have 32x32px target area | (1) `.fb-btn-icon` rule has `padding: 8px`. (2) With 16px icon, computed target is 32x32px. (3) `.fb-card-actions` rule has `gap: 8px`. | not_started |
| T-012 | FC-007 | unit | `__tests__/app.test.ts` | Selection mode shows instruction banner | (1) Call `detection.activate()`. (2) Banner element exists on `document.body` with `role="status"`. (3) Banner text is "Click on any element to capture feedback. Press Esc to cancel." | not_started |
| T-013 | FC-008 | unit | `__tests__/app.test.ts` | Selection banner dismisses on element click | (1) Activate selection, verify banner exists. (2) Simulate element click (trigger `onComponentSelect`). (3) Banner is removed from `document.body`. | not_started |
| T-014 | FC-008 | unit | `__tests__/app.test.ts` | Selection banner dismisses on Escape | (1) Activate selection, verify banner exists. (2) Dispatch Escape keydown. (3) Banner is removed from `document.body`. (4) Detection is deactivated. | not_started |
| T-015 | FC-009 | unit | `__tests__/extension-css.test.ts` | Entrance animation keyframes exist | (1) CSS contains `@keyframes fb-sidebar-in`. (2) CSS contains `@keyframes fb-modal-in`. (3) CSS contains `@keyframes fb-fab-cascade`. (4) Sidebar-in uses `translateX(100%)` to `translateX(0)`. (5) Modal-in uses `translateY(12px)` + `opacity: 0` to final state. | not_started |
| T-016 | FC-009 | unit | `__tests__/extension-css.test.ts` | Animation classes are applied to elements | (1) `.fb-sidebar` rule includes `animation: fb-sidebar-in 200ms ease-out`. (2) `.fb-modal` rule includes `animation: fb-modal-in 200ms ease-out`. (3) `.fb-fab-action` rule includes `animation: fb-fab-cascade`. | not_started |
| T-017 | FC-009 | unit | `__tests__/extension-css.test.ts` | prefers-reduced-motion disables all animations | (1) CSS contains `@media (prefers-reduced-motion: reduce)` block. (2) Block sets `animation-duration: 0s !important` on `:host *`. (3) Block sets `transition-duration: 0s !important`. | not_started |
| T-018 | FC-010 | unit | `__tests__/export-dialog.test.ts` | Copy all option exists and is first in dialog | (1) ExportDialog renders three options. (2) First option has text "Copy all to clipboard". (3) First option has clipboard icon. | not_started |
| T-019 | FC-010 | unit | `__tests__/app.test.ts` | Copy all writes filtered items to clipboard and shows toast | (1) Call copy all with 3 feedback items. (2) `navigator.clipboard.writeText` called with Markdown containing all 3 items. (3) Toast shows "Copied 3 items to clipboard". | not_started |
| T-020 | FC-010 | unit | `__tests__/app.test.ts` | Copy all clipboard failure shows error toast | (1) `navigator.clipboard.writeText` rejects. (2) Error toast "Failed to copy. Please try again." appears. | not_started |
| T-021 | FC-011 | unit | `__tests__/sidebar.test.ts` | Edit icon activates inline textarea | (1) Click pencil icon on card. (2) `.fb-card-comment` is replaced with textarea. (3) Textarea is pre-filled with existing comment. (4) Textarea has focus. (5) Sidebar remains in DOM. | not_started |
| T-022 | FC-011 | unit | `__tests__/sidebar.test.ts` | Only one card editable at a time | (1) Click edit on card A -- textarea appears. (2) Click edit on card B. (3) Card A reverts to static text (saved). (4) Card B now has textarea. | not_started |
| T-023 | FC-012 | unit | `__tests__/sidebar.test.ts` | Blur saves comment after debounce | (1) Enter edit mode, modify text. (2) Trigger blur. (3) After 1000ms debounce, `opts.onSaveEdit` called with updated comment. (4) "Saved" indicator appears. (5) Textarea reverts to static text. | not_started |
| T-024 | FC-012 | unit | `__tests__/sidebar.test.ts` | Save failure keeps textarea in edit mode | (1) Enter edit mode, modify text, blur. (2) `opts.onSaveEdit` rejects. (3) Textarea remains visible. (4) Error toast or indicator appears. | not_started |
| T-025 | FC-013 | unit | `__tests__/sidebar.test.ts` | Escape cancels edit and restores original text | (1) Enter edit mode, modify text. (2) Press Escape. (3) Textarea reverts to static text with ORIGINAL comment (not modified). (4) `opts.onSaveEdit` is NOT called. | not_started |
| T-026 | FC-013 | unit | `__tests__/sidebar.test.ts` | Escape in edit mode does not close sidebar | (1) Enter edit mode. (2) Press Escape. (3) Edit is cancelled. (4) Sidebar remains in DOM (not closed). (5) `e.stopPropagation()` prevents sidebar close handler from firing. | not_started |
| T-027 | FC-014 | unit | `__tests__/sidebar.test.ts` | Sidebar header has Share/Export button, footer is removed | (1) Render sidebar with feedbacks. (2) No `.fb-sidebar-footer` element exists. (3) Header contains button with text "Share / Export". (4) Clicking header button calls `opts.onShowExportDialog`. | not_started |
| T-028 | FC-014 | unit | `__tests__/export-dialog.test.ts` | Export dialog header says "Share / Export" | (1) Render ExportDialog. (2) Header h3 text is "Share / Export N items" (not "Export N items"). | not_started |
| T-029 | FC-015 | unit | `__tests__/app.test.ts` | Toast messages rotate between submissions | (1) Submit feedback item 1 -- toast message is from rotation set. (2) Submit feedback item 2 -- toast message differs from item 1. (3) All messages are from set: "Feedback saved!", "Got it!", "Captured!", "Nice catch!" | not_started |
| T-030 | FC-015 | unit | `__tests__/app.test.ts` | Milestone message at 5 items | (1) Set `state.feedbacks.length` to 5 after submit. (2) Milestone indicator "Thorough review!" appears (in sidebar header if open, or stored for next sidebar open). | not_started |
| T-031 | FC-015 | unit | `__tests__/app.test.ts` | Milestone message at 10 items | (1) Set `state.feedbacks.length` to 10 after submit. (2) Milestone indicator "Detailed review!" appears. | not_started |
| T-032 | FC-001, FC-002 | e2e | `e2e/delete-undo.spec.ts` | Flow 1: Delete with undo (full flow) | (1) Delete card, undo toast appears. (2) Click Undo within 8s, card restored. (3) Delete again, wait 8s+, item permanently removed from storage. (4) Delete A then B quickly -- A finalized, B has undo. | not_started |
| T-033 | FC-003, FC-010, FC-014 | e2e | `e2e/export-flow.spec.ts` | Flow 2: Export with success feedback | (1) Click "Share / Export" in sidebar header. (2) Export dialog opens with 3 options. (3) Copy all copies Markdown to clipboard, toast shows count. (4) Markdown downloads file, toast "Report downloaded". (5) ZIP downloads file, toast "Report downloaded". | not_started |
| T-034 | FC-004, FC-005, FC-007, FC-008 | e2e | `e2e/empty-state-capture.spec.ts` | Flow 3: Empty state to first capture | (1) Open sidebar with 0 feedbacks -- empty state displayed. (2) Click "Start reviewing" -- sidebar closes, crosshair + banner appears. (3) Click element -- banner dismisses, modal opens. (4) Submit -- sidebar shows new card, no empty state. | not_started |
| T-035 | FC-011, FC-012, FC-013 | e2e | `e2e/inline-edit.spec.ts` | Flow 4: Inline card editing | (1) Click edit icon -- textarea with existing comment. (2) Modify text, click outside -- saved with indicator. (3) Click edit again, press Escape -- original (saved) text restored. | not_started |
| T-036 | FC-009 | e2e | `e2e/animations.spec.ts` | Flow 5: Entrance animations | (1) Expand FAB menu -- cascade animation. (2) Open sidebar -- slide-in. (3) Open modal -- slide-up + fade. (4) With reduced motion: all appear instantly. | not_started |
| T-037 | FC-015 | e2e | `e2e/milestones.spec.ts` | Flow 6: Milestone celebrations | (1) Submit items 1-2 -- different toast messages. (2) Submit item 5 -- "Thorough review!" milestone. (3) Submit item 10 -- "Detailed review!" milestone. | not_started |

## 4. Exit-Criteria Mapping

| Exit Criterion | Evidence | Linked Tests | Status |
| -------------- | -------- | ------------ | ------ |
| EC-01: Undo delete works with 8s window, single pending undo, and error recovery | AC-001, AC-002: delete + undo within 8s; second delete finalizes first; storage failure restores card | T-001, T-002, T-003, T-004, T-005, T-032 | not_started |
| EC-02: Export success toasts appear for Markdown, ZIP, and Copy All | AC-003: each export action shows appropriate toast that auto-dismisses | T-006, T-007, T-008, T-019, T-020, T-033 | not_started |
| EC-03: Empty state shows designed layout with functioning CTA | AC-004: SVG illustration, heading, subtext, CTA button; CTA activates selection mode | T-009, T-010, T-034 | not_started |
| EC-04: Card action icons meet 32x32px minimum target | AC-005: computed styles verify padding and gap | T-011 | not_started |
| EC-05: Selection banner appears and dismisses correctly | AC-006: banner with role="status" during selection; dismisses on click or Escape | T-012, T-013, T-014, T-034 | not_started |
| EC-06: Entrance animations play and respect reduced motion | AC-007, AC-008: keyframes exist for sidebar, modal, FAB; prefers-reduced-motion suppresses all | T-015, T-016, T-017, T-036 | not_started |
| EC-07: Copy all to clipboard works with toast and error handling | AC-009: filtered items serialized to Markdown; correct count in toast; error on clipboard failure | T-018, T-019, T-020, T-033 | not_started |
| EC-08: Inline editing works: activate, save on blur, cancel with Escape | AC-010: textarea appears, sidebar stays open, blur saves, Escape cancels without saving, Escape does not close sidebar | T-021, T-022, T-023, T-024, T-025, T-026, T-035 | not_started |
| EC-09: Unified export surface replaces footer | AC-011: no footer export buttons; sidebar header "Share / Export" opens dialog | T-027, T-028, T-033 | not_started |
| EC-10: Toast messages rotate and milestones appear at 5 and 10 | AC-012: at least 2 different toast messages in first 5 submissions; milestone text at count 5 and 10 | T-029, T-030, T-031, T-037 | not_started |
| EC-11: All unit tests pass (T-001 through T-031) | `npm test` exits 0 with all 31 unit tests passing | T-001..T-031 | not_started |
| EC-12: All E2E tests pass (T-032 through T-037) | `npx playwright test` exits 0 with all 6 E2E specs passing | T-032..T-037 | not_started |

## 5. ADR Log

| ADR ID | Context | Options | Decision | Rationale | Impacted Docs | Status |
| ------ | ------- | ------- | -------- | --------- | ------------- | ------ |
| ADR-P2-001 | Undo delete requires deferred storage deletion. Current `StateManager.deleteFeedback` is immediate and irreversible. | (A) Add `softDelete` method to StateManager. (B) Defer deletion entirely at UI layer in FeedbackApp. | **(B) UI-layer deferral.** | StateManager should remain a thin storage wrapper. Pending delete is transient UI state (8s timer, visual hide/restore). No storage schema changes needed. Matches TR-001 recommendation. | `app.ts`, `sidebar.ts` | Accepted |
| ADR-P2-002 | Multiple toasts may overlap (undo toast vs success toast). | (A) Stack toasts vertically. (B) Priority override: undo replaces informational. (C) Queue sequentially. | **(B) Priority override.** | Undo toast is time-critical (8s window). Stacking adds layout complexity. Override is simplest extension of existing single-slot model. Matches Q-001 resolution. | `app.ts`, `extension-css.ts` | Accepted |
| ADR-P2-003 | Selection banner must be visible at viewport top during selection mode. Shadow DOM would obscure it. | (A) Render inside shadow DOM with high z-index. (B) Render on `document.body` like ComponentOverlayUI. | **(B) Render on `document.body`.** | Matches existing pattern for page-level UI (overlay). Banner must not intercept element clicks (`pointer-events: none` on non-interactive areas). Lifecycle managed by FeedbackApp reacting to DetectionController state changes. | `app.ts`, `detection-controller.ts` | Accepted |
| ADR-P2-004 | Inline edit introduces Escape key conflict with sidebar close. | (A) Cancel flag pattern: Escape sets flag, blur checks flag before saving. (B) Remove textarea from DOM on Escape before blur fires. (C) Use requestAnimationFrame to defer blur. | **(A) Cancel flag.** | Standard pattern used by Notion, Linear. Reliable cross-browser. Option B causes DOM timing issues. Matches Q-002 resolution. | `sidebar.ts` | Accepted |
| ADR-P2-005 | Sidebar footer has export buttons that create duplicate export surface with FAB menu. | (A) Keep footer with only Clear All. (B) Move Clear All to header. (C) Remove footer entirely. | **(C) Remove footer entirely.** | Phase 1 demoted Clear All from FAB menu. Footer redundancy is the problem stated in F-09. Clear All via FAB menu (with confirm dialog) is sufficient. Simplifies sidebar layout. Matches Q-005 resolution. | `sidebar.ts`, `extension-css.ts` | Accepted |
| ADR-P2-006 | Empty state illustration: custom SVG vs reuse existing icons. | (A) Purpose-built 64px clipboard-with-plus SVG in `icons.ts`. (B) Scale existing `copyIcon` to 64px. (C) CSS-only with emoji. | **(A) Custom SVG.** | Existing icons are designed for 16-20px and look crude at 64px. A 10-15 line SVG path is minimal complexity. Matches Q-003 resolution. | `icons.ts`, `sidebar.ts` | Accepted |
| ADR-P2-007 | Milestone celebrations: text-only vs confetti animation. | (A) Text-only milestone in sidebar header. (B) Text + CSS confetti. (C) Text + canvas confetti. | **(A) Text-only.** | Confetti adds significant complexity for marginal delight. Text messages with subtle background color pulse are sufficient. Confetti can be revisited in a brand personality phase. Matches Q-004 resolution. | `app.ts`, `sidebar.ts`, `extension-css.ts` | Accepted |

---

### Implementation Notes

**File change summary (ordered by dependency):**

1. `packages/extension/src/ui/icons.ts` -- add `emptyStateIllustration()` and `clipboardCopyIcon()`
2. `packages/extension/src/styles/extension-css.ts` -- all CSS changes (sizing, animations, new classes, remove footer)
3. `packages/extension/src/core/detection-controller.ts` -- add lifecycle callbacks
4. `packages/extension/src/ui/export-dialog.ts` -- add copy-all option, rename header
5. `packages/extension/src/ui/sidebar.ts` -- remove footer, add header export button, redesign empty state, add inline edit, update interface
6. `packages/extension/src/ui/app.ts` -- undo toast, export toasts, milestone rotation, selection banner, wire new callbacks

**CSS additions (extension-css.ts):**

- `.fb-btn-icon` padding: `6px` -> `8px` (32x32 target from 28x28)
- `.fb-card-actions` gap: `4px` -> `8px`
- `@keyframes fb-sidebar-in` -- `translateX(100%) -> translateX(0)`, 200ms ease-out
- `@keyframes fb-modal-in` -- `translateY(12px) opacity(0) -> translateY(0) opacity(1)`, 200ms ease-out
- `@keyframes fb-fab-cascade` -- `translateY(8px) opacity(0) -> translateY(0) opacity(1)`, 150ms ease-out
- `.fb-fab-action:nth-child(n)` -- `animation-delay` at 50ms stagger
- `.fb-sidebar` -- add `animation: fb-sidebar-in 200ms ease-out`
- `.fb-modal` -- add `animation: fb-modal-in 200ms ease-out`
- `.fb-toast-undo` -- distinct styling: left border accent `var(--fb-error)`, undo button styled as link
- `.fb-toast-undo .fb-toast-undo-btn` -- styled as text button
- `.fb-selection-banner` -- fixed top, full-width, `z-index: 2147483646`, inline styles on `document.body`
- `.fb-empty` redesign -- flex column, centered, SVG + heading + subtext + CTA layout
- `.fb-empty-illustration` -- 64px, `color: var(--fb-text-muted)`
- `.fb-inline-edit-textarea` -- styled textarea matching card width, min-height 60px
- `.fb-saved-indicator` -- small green text "Saved", fades out
- `.fb-milestone` -- sidebar header badge with subtle pulse background
- Remove `.fb-sidebar-footer` styles
