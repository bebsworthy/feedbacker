# Phase Research: Polish Core User Flows

status: complete
phase_key: phase-2-polish-core-user-flows
phase_number: 2
last_updated: 2026-03-27

## 1. Scope and References

| Source | Key Findings | Notes |
| ------ | ------------ | ----- |
| BRD (phase-2) | 10 improvements mapped to 15 FCs covering undo delete, export toasts, empty state, icon sizing, selection banner, animations, copy all, inline edit, unified export, milestones | All changes scoped to extension package |
| .audit/ux/04-audit.md | Findings F-03, F-08, F-09, F-13-F-16, F-25-F-26, F-31 identify friction in manage/export/delete flows | Phase 2 addresses all 10 findings |
| .audit/ux/05-proposals.md | Detailed proposals with acceptance criteria for each finding | Proposals align with BRD FCs |
| .audit/ux/01-user-goals.md | J-002 (manage) and J-003 (share) are primary jobs; satisfaction gaps of 2 and 5 respectively | Phase 2 directly improves both |
| Phase 1 delivery | Toast infrastructure (`showToast`), coach mark, `prefers-reduced-motion` blanket rule, event isolation all exist | Reusable foundations for Phase 2 |

## 1b. Architecture Reference

- Shared reference: `phases/research/architecture-reference.md`
- Phase-specific architectural notes:

**Toast system requires upgrade.** Current `showToast` is fire-and-forget (3.5s auto-dismiss, single slot). Phase 2 needs: (a) undo toasts with interactive button and 8s timeout, (b) toast priority (undo > success), (c) concurrent toast handling (delete undo vs export success). The single-toast design needs extension to a priority queue or stacking model.

**Inline edit changes the sidebar's data flow.** Currently `ManagerSidebar` treats cards as read-only renders. The `onEdit` callback destroys the sidebar and opens a modal. Inline editing requires the card to become stateful (read mode vs edit mode), with blur/keydown handlers and direct storage writes from within the sidebar. The `SidebarOptions.onEdit` callback signature must change to support in-place save.

**Selection banner renders outside shadow DOM.** The banner (FC-007) must be visible at viewport top during selection mode, which operates on `document` listeners. The banner should render on `document.body` alongside `ComponentOverlayUI` (not inside shadow DOM) since: (a) it must not be obscured by page content with high z-index, (b) it must not intercept element clicks, and (c) its lifecycle is tied to `DetectionController`, not the sidebar/modal.

## 2. Findings Register

| ID | Type | Description | Impact | Evidence | Proposed Direction |
| --- | ---- | ----------- | ------ | -------- | ------------------ |
| TR-001 | Feasibility | Undo delete requires deferred storage deletion. `StateManager.deleteFeedback` currently calls `storage.delete(id)` immediately and re-reads state. | High -- core behavioral change | `state-manager.ts:54-60`: delete is immediate and irreversible | Add `pendingDelete` state to `FeedbackApp`. On delete: hide card from UI, start 8s timer. On timeout: call `state.deleteFeedback()`. On undo: restore card visibility. No StateManager changes needed -- deferral is purely a UI-layer concern. |
| TR-002 | Feasibility | Clipboard API (`navigator.clipboard.writeText`) works inside shadow DOM. Extension already uses it in `sidebar.ts:335` for per-item copy. | Low risk | `sidebar.ts:334-338`: `navigator.clipboard.writeText(markdown)` works today | "Copy all" (FC-010) can reuse same pattern. Serialize all filtered items via `MarkdownExporter.exportItems()` and write to clipboard. Fallback to `document.execCommand('copy')` is not needed in Chrome extensions (Clipboard API is always available in secure contexts). |
| TR-003 | Architecture | Entrance animations (FC-009) are CSS-only. Existing `@keyframes fb-toast-in` proves the pattern. Sidebar, modal, and FAB menu need new `@keyframes` declarations. | Low risk | `extension-css.ts:510-513`: toast already animates with slide+fade | Add `fb-sidebar-in` (translateX 100% -> 0), `fb-modal-in` (translateY 12px + opacity), `fb-fab-cascade` (translateY + opacity with `animation-delay` per child). Apply via class on element creation. Existing `prefers-reduced-motion` blanket rule (line 551-560) already suppresses all animations -- no additional work needed. |
| TR-004 | Architecture | Inline edit (FC-011/012/013) introduces Escape key conflict. Sidebar currently listens for Escape to close (lines 108-114, 120-125). During inline edit, Escape must cancel editing, not close sidebar. | Medium | `sidebar.ts:108-125`: two separate Escape listeners on document and sidebar element | Inline edit textarea must call `e.stopPropagation()` on Escape to prevent sidebar close. The `sidebar.addEventListener('keydown')` handler should check if an edit is active before closing. |
| TR-005 | Architecture | Icon sizing change (FC-006) is CSS-only. Current `.fb-btn-icon` has `padding: 6px` yielding 28x28px with 16px icon. Changing to `padding: 8px` yields 32x32px. `.fb-card-actions` gap needs 4px -> 8px. | Low risk | `extension-css.ts:257-266`: `.fb-btn-icon { padding: 6px }`, line 393: `.fb-card-actions { gap: 4px }` | Two CSS property changes. No DOM or JS changes required. |
| TR-006 | Architecture | Empty state SVG (FC-004) must be embedded as inline SVG string (no external assets in extension Shadow DOM). Current empty state is plain text in `sidebar.ts:204-209`. | Low risk | `icons.ts` already exports SVG string functions (`closeIcon`, `trashIcon`, etc.) | Add a new `emptyStateIcon(size)` function to `icons.ts` returning an inline SVG (clipboard or chat bubble). Embed in the redesigned empty state container. |
| TR-007 | Architecture | Unified export surface (FC-009/014) removes sidebar footer export buttons and adds "Share / Export" to sidebar header. `ExportDialog` needs a third option ("Copy all to clipboard"). | Medium | `sidebar.ts:86-105`: footer with Markdown/ZIP/Clear All buttons. `export-dialog.ts:51-73`: two options | Remove footer export buttons. Add header button that calls `opts.onExport('dialog')` or similar callback. Add "Copy all" option to `ExportDialog` with clipboard icon, positioned first. `ExportDialogOptions` needs new `onCopyAll` callback or extend `onExport` format to include `'clipboard'`. |
| TR-008 | Risk | Milestone celebrations (FC-015) need access to the total feedback count across all sessions, not just the current session count. `StateManager.feedbacks.length` reflects total stored items. | Low | `state-manager.ts:21-23`: getter returns all feedbacks from storage | The milestone check should fire on `feedback:submit` event when `state.feedbacks.length` reaches 5 or 10. Toast message rotation can use a simple index counter stored in the FeedbackApp instance (no persistence needed). |

## 3. Open Questions and Decisions

| Q ID | Question | Resolution Propositions | Recommended Option | Status |
| ---- | -------- | ----------------------- | ------------------ | ------ |
| Q-001 | Should undo toast overlap with success toast if user deletes right after submitting? (R-001 from BRD) | (A) Stack toasts vertically. (B) Undo toast replaces any active toast (priority override). (C) Queue toasts sequentially. | **(B) Priority override.** Undo toast is time-critical (8s window). Success toasts are informational. Replacing is simpler than stacking and matches the existing single-toast model. Implementation: undo toast gets a separate CSS class (`fb-toast-undo`) but occupies the same slot. | Open -> Resolved |
| Q-002 | How to handle blur vs Escape race condition during inline edit? (R-002 from BRD) | (A) Escape sets a `cancelled` flag checked by blur handler before saving. (B) Escape removes the textarea from DOM before blur fires. (C) Use `requestAnimationFrame` to defer blur handling. | **(A) Cancel flag.** Set `this.editCancelled = true` on Escape, check in blur handler. Reset flag when entering edit mode. This is the standard pattern (used in Notion, Linear). Option B causes DOM timing issues. | Open -> Resolved |
| Q-003 | Should empty state use a custom SVG illustration or repurpose an existing icon? (Q-001 from BRD) | (A) Custom 64px SVG illustration (clipboard with checkmark). (B) Reuse existing `copyIcon` or similar at 64px. (C) CSS-only empty state with large emoji. | **(A) Simple custom SVG.** A purpose-built 64px clipboard-with-plus icon is 10-15 lines of SVG path data. Existing icons are designed for 16-20px and will look crude at 64px. Add as `emptyStateIllustration()` in `icons.ts`. | Open -> Resolved |
| Q-004 | Should milestone messages include confetti animation at 10 items? (Q-002 from BRD) | (A) Text-only toast with rotating messages. (B) Text toast + CSS confetti keyframe animation. (C) Text toast + canvas-based confetti. | **(A) Text-only.** Confetti adds significant complexity (either CSS with many pseudo-elements or a canvas overlay) for marginal delight. Text milestone messages in the sidebar header ("Thorough review!") with a subtle background color pulse are sufficient. Confetti can be revisited in a future brand personality phase. | Open -> Resolved |
| Q-005 | Where should "Clear all" move after footer export buttons are removed? (Q-003 from BRD) | (A) Keep Clear all in sidebar footer as sole footer element. (B) Move to sidebar header as a secondary icon button. (C) Remove footer entirely; access Clear all only via FAB menu. | **(C) Remove footer.** Phase 1 already demoted Clear all from the FAB menu. Keeping it in the sidebar footer is redundant. The FAB menu "Clear all" (with confirm dialog) is sufficient. This simplifies the sidebar layout. If item count display is wanted, show it in the header alongside the existing count text. | Open -> Resolved |

---
