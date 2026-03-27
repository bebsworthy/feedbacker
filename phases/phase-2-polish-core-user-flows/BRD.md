# Phase BRD: Polish Core User Flows

status: not_started
phase_key: phase-2-polish-core-user-flows
phase_number: 2
last_updated: 2026-03-27

## 1. Context Intake

| Source | Relevance | Notes |
| ------ | --------- | ----- |
| .audit/ux/04-audit.md | High | Findings F-03, F-08, F-09, F-13, F-14, F-15, F-16, F-25, F-26, F-31 define the 10 improvements in scope |
| .audit/ux/05-proposals.md | High | Detailed proposals with current state, proposed improvement, visual reference, and acceptance criteria for each finding |
| .audit/ux/01-user-goals.md | Medium | JTBD context: J-001 (capture), J-002 (manage), J-003 (share) are the primary jobs served by this phase |
| Phase 1 implementation | High | Phase 1 delivered F-01 (coach mark), F-02 (submit toast), F-04 (label renames), F-06 (Cmd+Enter), F-07 (clear all demotion), accessibility fixes. Toast infrastructure (showToast) already exists in app.ts |

## 2. Problem Statement

After Phase 1's critical UX fixes, users can now discover the tool and submit feedback without accidental data loss. However, the core user flows -- managing feedback, editing, exporting, and deleting -- still have friction points that reduce confidence and flow:

1. **Deletion is permanent and instant** -- no undo mechanism exists for single-item delete (F-03), creating anxiety about accidental data loss (J-002 outcome 3)
2. **No system feedback on export** -- file downloads happen silently with no confirmation (F-13), undermining confidence that the export worked (J-003 outcome 4)
3. **Empty state is a dead end** -- the sidebar shows plain text with no CTA when no feedback exists (F-14), failing to guide users toward their first capture (J-002)
4. **Card actions are too small** -- 28x28px icon-only buttons fall below the 32px desktop recommendation (F-15), causing mis-taps (J-002 outcome 1)
5. **Selection mode has no guidance** -- crosshair cursor appears with no instruction text (F-16), leaving first-time users uncertain about what to do (J-001, J-005)
6. **UI appears and disappears abruptly** -- modal, sidebar, and FAB menu have no entrance/exit animations (F-25), making the experience feel mechanical
7. **No bulk copy** -- users must copy feedback items one at a time to clipboard (F-31), making Slack/email sharing tedious (J-003 outcome 5)
8. **Edit destroys sidebar context** -- clicking Edit closes the sidebar, opens a modal, and requires re-opening the sidebar afterward (F-08), causing jarring context loss (J-002 outcome 4)
9. **Two export paths with different UX** -- FAB menu and sidebar footer both offer export with inconsistent experiences (F-09), violating consistency (J-003)
10. **No emotional reward** -- identical experience whether the user has captured 1 or 20 items (F-26), missing an opportunity for delight

## 3. Goals and Non-Goals

### Goals

- G-1: Provide reversible deletion with undo capability so users never permanently lose feedback by accident
- G-2: Add system feedback (toasts) for all destructive and export actions so users always know what happened
- G-3: Guide users through empty states and selection mode with clear instructions and CTAs
- G-4: Improve touch/click target sizes for card actions to meet desktop usability standards
- G-5: Add entrance/exit animations to all overlay UI (modal, sidebar, FAB menu) that respect prefers-reduced-motion
- G-6: Consolidate all export/share actions into a single consistent surface with "Copy all" as a primary action
- G-7: Enable inline editing of feedback comments without leaving the sidebar
- G-8: Add milestone celebrations to create moments of delight during extended review sessions

### Non-Goals

- NG-1: Feedback categorization/type chips (F-34) -- deferred to a future phase
- NG-2: Search and sort in sidebar (F-11) -- deferred to a future phase
- NG-3: Project tracker integrations (F-36) -- requires OAuth, API design; deferred to Q3+
- NG-4: Brand voice overhaul (F-27) -- deferred until functional UX is solid; F-26 provides initial personality
- NG-5: Navigate-to-element from sidebar (J-007) -- requires element re-location strategy not yet designed
- NG-6: Scroll-wheel element selection granularity (F-17) -- separate interaction model change
- NG-7: Exit animations that delay UI teardown -- entrance animations only in this phase; exit animations that require async teardown are deferred

## 4. Scope Definition

### Files in scope (confirmed via codebase scan)

| File | Changes |
|------|---------|
| `packages/extension/src/ui/sidebar.ts` | Undo toast for delete (F-03), empty state redesign (F-14), inline card editing (F-08), remove footer export buttons (F-09) |
| `packages/extension/src/ui/app.ts` | Export success toast (F-13), milestone celebrations (F-26), wire up unified export from sidebar header, selection mode banner (F-16) |
| `packages/extension/src/ui/export-dialog.ts` | Add "Copy all to clipboard" option (F-31), rename dialog header to "Share / Export" (F-09) |
| `packages/extension/src/ui/fab.ts` | No structural changes; FAB "Share / Export" action already wired to showExportDialog |
| `packages/extension/src/styles/extension-css.ts` | Larger card action icons (F-15), entrance animations (F-25), undo toast styles (F-03), selection banner styles (F-16), empty state styles (F-14), inline edit styles (F-08), milestone styles (F-26) |
| `packages/extension/src/core/detection-controller.ts` | Selection mode banner lifecycle hook (F-16) |
| `packages/extension/src/ui/overlay.ts` | Selection banner display coordination (F-16) |

### Deliverables

- D-1: Undo toast for single-item delete with 8-second recovery window
- D-2: Export success toast after Markdown, ZIP, and Copy All actions
- D-3: Redesigned empty state with SVG illustration, heading, subtext, and CTA button
- D-4: Card action icons sized to 32x32px minimum target area
- D-5: Selection mode instruction banner with dismiss-on-action behavior
- D-6: Entrance animations for modal, sidebar, and FAB menu (respecting prefers-reduced-motion)
- D-7: "Copy all to clipboard" as primary action in unified export dialog
- D-8: Inline card editing in sidebar (textarea on edit, auto-save on blur)
- D-9: Unified export surface: sidebar header "Share / Export" button replaces footer export buttons
- D-10: Milestone celebrations at 5 and 10 items with rotating toast messages

## 5. Functional Capability Contract

| FC ID | Actor | Preconditions | User Action | System Response | Not Allowed | Error Mapping | Evidence Target |
| ----- | ----- | ------------- | ----------- | --------------- | ----------- | ------------- | --------------- |
| FC-001 | Reviewer | Sidebar is open; at least one feedback card exists | Clicks the delete (trash) icon on a feedback card | Card slides out with animation. Undo toast appears at bottom of sidebar: "Feedback deleted. [Undo]" with 8-second countdown. Item is NOT removed from storage yet. | (1) Permanently deleting the item before the 8-second timeout expires. (2) Allowing more than one pending undo at a time -- a new delete finalizes the previous pending delete. (3) Hiding the undo toast behind other UI elements. | If storage delete fails after timeout: show error toast "Failed to delete. Item restored." and restore the card. | Undo toast is visible with role="status"; card is restorable within 8 seconds |
| FC-002 | Reviewer | Undo toast is visible; pending delete has not yet expired | Clicks the "Undo" button on the undo toast | Card slides back into its original position. Toast dismisses. Deletion is cancelled; item remains in storage unchanged. | (1) Restoring the item in a different position than its original list order. (2) Leaving stale undo toasts visible after undo is clicked. | None -- undo is a client-side state restoration with no async operation. | Card reappears at original position; toast is removed |
| FC-003 | Reviewer | Export dialog is open; user initiates Markdown or ZIP export | Clicks Markdown or ZIP option in export dialog | File downloads to user's default download location. Export dialog closes. Toast appears: "Report downloaded" and auto-dismisses after 3.5 seconds. | (1) Downloading the file without showing a success toast. (2) Showing a toast if the export fails (error toast should be shown instead). | If export fails (e.g., ZIP generation error): show error toast "Export failed. Please try again." instead of success toast. | Toast with "Report downloaded" text is visible after export |
| FC-004 | Reviewer | Sidebar is open; current filter shows zero feedback items | System displays empty state | Empty state shows: (1) muted SVG illustration (64px), (2) heading "No feedback yet", (3) subtext "Click 'New feedback' to start your review", (4) primary CTA button "Start reviewing". | (1) Showing the empty state when feedback items exist for the current filter. (2) Showing the raw text "No feedback for this site yet" without the designed empty state layout. | None -- empty state is a static display with no async operations. | Empty state container includes SVG, heading, subtext, and CTA button |
| FC-005 | Reviewer | Empty state is displayed in sidebar; CTA button is visible | Clicks "Start reviewing" CTA button | Sidebar closes. Selection mode activates (crosshair cursor). Selection banner appears (see FC-007). | (1) Keeping the sidebar open while selection mode is active. (2) Activating selection mode without showing the instruction banner. | None -- same as existing new-feedback flow. | Selection mode is active after clicking CTA |
| FC-006 | Reviewer | Sidebar is open; feedback cards are visible | Interacts with card action buttons (edit, copy, delete) | Action buttons have at least 32x32px touch/click target area with 8px padding and 8px gap between icons. | (1) Reducing icon target size below 32x32px. (2) Changing the visual icon size (16px SVG remains same) -- only padding increases. (3) Altering the button functionality. | None -- this is a CSS-only change. | Computed style of .fb-btn-icon shows min 32x32px target; .fb-card-actions gap is 8px |
| FC-007 | Reviewer | Selection mode is activated (via FAB menu, empty state CTA, or any entry point) | System enters crosshair selection mode | Instruction banner appears at top of viewport: "Click on any element to capture feedback. Press Esc to cancel." Banner has role="status" for screen reader announcement. | (1) Showing the banner outside of selection mode. (2) Allowing the banner to intercept element clicks on the page (banner must not cover clickable areas or must be positioned to avoid overlap with selection targets). (3) Showing multiple banners simultaneously. | None -- banner is a passive status display. | Banner element with role="status" exists during selection mode |
| FC-008 | Reviewer | Selection banner is visible; user is in selection mode | Clicks an element on the page OR presses Escape | Banner dismisses with slide-up animation. If element was clicked: feedback capture flow proceeds (modal opens). If Escape was pressed: selection mode deactivates, return to idle. | (1) Leaving the banner visible after selection mode ends. (2) Removing the banner without animation (unless prefers-reduced-motion is set). | None -- banner lifecycle is tied to selection mode state. | Banner is removed from DOM after element click or Escape |
| FC-009 | Reviewer | Modal, sidebar, or FAB menu is about to appear | System shows the UI element | Modal slides up 12px and fades in (200ms). Sidebar slides in from right (200ms). FAB menu items cascade in from bottom (150ms each, 50ms stagger). All animations are suppressed when prefers-reduced-motion: reduce is set. | (1) Playing animations when prefers-reduced-motion: reduce is active. (2) Animations exceeding 300ms duration. (3) Animations causing layout shift in the host page. | None -- animations are CSS-only with no failure mode. | @keyframes declarations exist; prefers-reduced-motion media query disables them |
| FC-010 | Reviewer | Export dialog is open (via FAB or sidebar header) | Clicks "Copy all to clipboard" | All feedback items matching the current filter are serialized to Markdown and copied to the system clipboard. Toast appears: "Copied N items to clipboard" where N is the count. Export dialog closes. | (1) Copying items that do not match the current site filter (if "This site" filter is active, only current-site items are copied). (2) Copying without showing a success toast. (3) Including the "Copy all" option when zero feedback items exist. | If clipboard write fails: show error toast "Failed to copy. Please try again." | Clipboard contains Markdown text; toast shows correct item count |
| FC-011 | Reviewer | Sidebar is open; feedback card with comment is visible | Clicks the edit (pencil) icon on a card | Comment text is replaced with an inline textarea pre-filled with the existing comment. Textarea receives focus. Sidebar remains open. Card remains in its current list position. | (1) Closing the sidebar to open a separate modal for editing (the old F-08 behavior). (2) Allowing multiple cards to be in edit mode simultaneously. (3) Losing the original comment if the user has not yet saved. | None -- edit mode is a local DOM state change. | Textarea element exists inside the card; sidebar remains in DOM |
| FC-012 | Reviewer | A feedback card is in inline edit mode (textarea visible) | Clicks outside the textarea (blur) or waits for 1-second debounce after last keystroke | Comment is saved to storage. Textarea reverts to static text display showing the updated comment. Brief "Saved" indicator appears on the card. | (1) Saving on every keystroke without debounce (must debounce at 1 second). (2) Losing unsaved changes on blur without saving. (3) Leaving the card in edit mode after save completes. | If storage save fails: show error toast "Failed to save. Please try again." and keep textarea in edit mode so user does not lose their text. | Updated comment persists in chrome.storage.local; "Saved" indicator appears |
| FC-013 | Reviewer | A feedback card is in inline edit mode | Presses Escape | Edit is cancelled. Textarea reverts to static text showing the original (pre-edit) comment. No save occurs. | (1) Saving the edited text when Escape is pressed. (2) Closing the sidebar when Escape is pressed during inline edit (Escape must be captured by the edit mode first). | None -- cancel is a local state restoration. | Original comment text is restored; no storage write occurs |
| FC-014 | Reviewer | Sidebar is open; at least one feedback item exists | Clicks "Share / Export" button in the sidebar header | Export dialog opens (same dialog as FAB menu "Share / Export"). Dialog shows three options: "Copy all to clipboard" (primary), "Markdown", "ZIP Archive". | (1) Opening a different export UI than the one accessed via FAB menu -- both must open the identical ExportDialog. (2) Showing the footer export buttons (Markdown/ZIP) -- footer export buttons are removed. | None -- dialog open is a synchronous DOM operation. | Export dialog is opened with "Copy all" as first option |
| FC-015 | Reviewer | Feedback has just been submitted (submit button clicked) | System increments the feedback count | Toast message rotates between variations: "Feedback saved!", "Got it!", "Captured!", "Nice catch!" At 5 items: sidebar header shows milestone message "Thorough review!" At 10 items: sidebar header shows "Detailed review!" Milestone messages disappear after 5 seconds or on sidebar close. | (1) Showing milestone messages when prefers-reduced-motion: reduce is active and the milestone includes animation. (2) Showing the same toast message consecutively (must rotate). (3) Showing milestones for counts other than 5 and 10. | None -- milestone display is a client-side count check with no failure mode. | Toast message varies between submissions; milestone message appears at count 5 and 10 |

## 6. User Can / User Cannot

### User Can

- UC-01: Delete a feedback item and undo the deletion within 8 seconds
- UC-02: See a success toast after every export action (Markdown download, ZIP download, Copy All)
- UC-03: See a designed empty state with illustration and CTA when no feedback exists
- UC-04: Click "Start reviewing" in the empty state to begin element selection
- UC-05: Tap card action icons (edit, copy, delete) with adequate 32x32px target areas
- UC-06: See an instruction banner during selection mode explaining what to do
- UC-07: Dismiss the selection banner by clicking an element or pressing Escape
- UC-08: See smooth entrance animations on modal, sidebar, and FAB menu
- UC-09: Copy all feedback items to clipboard as Markdown from the export dialog
- UC-10: Edit a feedback comment inline on the card without leaving the sidebar
- UC-11: Cancel an inline edit with Escape to restore the original comment
- UC-12: Access export/share from a single consistent surface (sidebar header or FAB menu)
- UC-13: See varied success messages and milestone celebrations during a review session

### User Cannot

- UX-01: Permanently delete a feedback item instantly without an 8-second undo window
- UX-02: Recover a deleted item after the 8-second undo window has expired
- UX-03: Have more than one pending undo at a time (new delete finalizes previous)
- UX-04: Export from the sidebar footer (footer export buttons are removed)
- UX-05: Edit feedback via a separate modal that closes the sidebar (old edit flow is replaced)
- UX-06: Edit multiple cards simultaneously (only one card can be in edit mode at a time)
- UX-07: See animations if prefers-reduced-motion: reduce is set in their OS
- UX-08: Copy all feedback to clipboard if no feedback items exist (button disabled/hidden)
- UX-09: See milestone celebrations at counts other than 5 and 10
- UX-10: Trigger the selection banner outside of selection mode

## 7. E2E User Test Flows

### Flow 1: Delete with undo

**Preconditions:** Extension active on a page. At least 2 feedback items captured. Sidebar is open.

| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Click the trash icon on the first feedback card | Card slides out. Undo toast appears: "Feedback deleted. [Undo]" |
| 2 | Wait 3 seconds, then click "Undo" | Card slides back into its original position. Toast dismisses. Feedback count unchanged. |
| 3 | Click the trash icon on the same card again | Card slides out. Undo toast appears again. |
| 4 | Wait 8+ seconds without clicking Undo | Toast auto-dismisses. Item is permanently deleted. Feedback count decrements by 1. |

**Error path:** If user deletes card A, then immediately deletes card B before card A's 8-second timeout, card A is permanently deleted and only card B has an active undo.

### Flow 2: Export with success feedback

**Preconditions:** Extension active. At least 1 feedback item captured. Sidebar is open.

| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Click "Share / Export" in sidebar header | Export dialog opens with three options: "Copy all to clipboard", "Markdown", "ZIP Archive" |
| 2 | Click "Copy all to clipboard" | Clipboard contains Markdown for all filtered items. Toast: "Copied N items to clipboard". Dialog closes. |
| 3 | Re-open export dialog. Click "Markdown" | .md file downloads. Toast: "Report downloaded". Dialog closes. |
| 4 | Re-open export dialog. Click "ZIP Archive" | .zip file downloads. Toast: "Report downloaded". Dialog closes. |

**Error path:** If clipboard write fails (e.g., permissions denied), error toast "Failed to copy. Please try again." appears instead of success toast.

### Flow 3: Empty state to first capture

**Preconditions:** Extension active on a page. Zero feedback items for this site.

| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Open sidebar (via FAB menu "View feedback") | Sidebar opens. Empty state shows: SVG illustration, "No feedback yet" heading, subtext, "Start reviewing" button. |
| 2 | Click "Start reviewing" | Sidebar closes. Crosshair cursor activates. Instruction banner appears at top: "Click on any element to capture feedback. Press Esc to cancel." |
| 3 | Click on a page element | Banner dismisses. Feedback modal opens for the selected element. |
| 4 | Submit feedback. Open sidebar again. | Sidebar shows the new feedback card. Empty state is no longer visible. |

**Error path:** If user presses Escape in step 3 instead of clicking an element, selection mode deactivates, banner dismisses, and user returns to idle state.

### Flow 4: Inline card editing

**Preconditions:** Extension active. At least 1 feedback item with a comment. Sidebar is open.

| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Click the edit (pencil) icon on a feedback card | Comment text becomes an editable textarea, pre-filled with the existing comment. Textarea has focus. Sidebar remains open. |
| 2 | Modify the comment text | Textarea shows the new text. |
| 3 | Click outside the textarea (blur) | Comment saves after 1-second debounce. "Saved" indicator appears briefly. Textarea reverts to static text with updated comment. |
| 4 | Click edit on the same card again. Press Escape. | Edit mode activates. Pressing Escape cancels -- original (previously saved) comment is restored. No save occurs. |

**Error path:** If storage save fails on blur, error toast appears and textarea remains in edit mode so the user can retry or copy their text.

### Flow 5: Entrance animations

**Preconditions:** Extension active. prefers-reduced-motion is NOT set.

| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Click FAB to expand menu | Menu items cascade in from bottom with staggered animation (150ms each, 50ms stagger). |
| 2 | Click "View feedback" | Sidebar slides in from the right (200ms ease-out). |
| 3 | Close sidebar. Trigger new feedback flow. Submit feedback. | Modal slides up 12px and fades in (200ms ease-out). |

**Reduced motion path:** Set prefers-reduced-motion: reduce in OS. Repeat steps 1-3. All UI elements appear instantly with no animation.

### Flow 6: Milestone celebrations

**Preconditions:** Extension active. Zero feedback items captured so far.

| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1 | Submit feedback item 1 | Toast shows one of: "Feedback saved!", "Got it!", "Captured!", "Nice catch!" |
| 2 | Submit feedback item 2 | Toast shows a different variation than step 1. |
| 3 | Submit feedback items 3, 4, 5 | On the 5th item, sidebar (if opened) shows "Thorough review!" milestone message. |
| 4 | Submit feedback items 6-10 | On the 10th item, sidebar (if opened) shows "Detailed review!" milestone message. |

## 8. Acceptance Criteria

| AC ID | Covers FC | Criterion | Validation Signal |
| ----- | --------- | --------- | ----------------- |
| AC-001 | FC-001, FC-002 | Deleting a feedback item shows an undo toast and the item is recoverable for 8 seconds | Click delete on a card in sidebar. Undo toast appears with role="status". Click Undo within 8s -- card is restored. Wait 8s without undo -- item is permanently deleted from chrome.storage.local. |
| AC-002 | FC-001 | Only one pending undo exists at a time | Delete card A, then delete card B before A's timeout. Verify card A is permanently deleted and only card B has an active undo toast. |
| AC-003 | FC-003 | Export actions show a success toast | Trigger Markdown export, ZIP export, and Copy All from the export dialog. Each shows a toast ("Report downloaded" or "Copied N items to clipboard") that auto-dismisses after 3.5s. |
| AC-004 | FC-004, FC-005 | Empty state shows designed layout with functioning CTA | Open sidebar with zero feedback for current site. Verify: SVG illustration, "No feedback yet" heading, subtext, "Start reviewing" button. Click button -- sidebar closes and selection mode activates. |
| AC-005 | FC-006 | Card action icons meet 32x32px minimum target size | Inspect computed styles of .fb-btn-icon elements in sidebar cards. Verify width and height >= 32px. Verify .fb-card-actions gap is 8px. |
| AC-006 | FC-007, FC-008 | Selection mode shows and dismisses instruction banner | Enter selection mode. Verify banner at top with role="status" reads "Click on any element to capture feedback. Press Esc to cancel." Click an element -- banner dismisses. Re-enter selection mode, press Escape -- banner dismisses. |
| AC-007 | FC-009 | Entrance animations play on modal, sidebar, and FAB menu | Expand FAB menu -- items cascade in. Open sidebar -- slides from right. Open modal -- slides up and fades in. All animations 150-200ms. |
| AC-008 | FC-009 | Animations respect prefers-reduced-motion | Set prefers-reduced-motion: reduce. Verify that extension-css.ts contains a @media (prefers-reduced-motion: reduce) block that sets animation-duration: 0s and transition-duration: 0s on all fb-* animated elements. Open sidebar, modal, FAB menu -- all appear instantly. |
| AC-009 | FC-010, FC-014 | "Copy all to clipboard" copies filtered items and shows toast | Open export dialog. Click "Copy all to clipboard". Paste into text editor -- content is valid Markdown containing all feedback items for the current filter. Toast shows "Copied N items to clipboard" with correct count. |
| AC-010 | FC-011, FC-012, FC-013 | Inline editing works: activate, save on blur, cancel with Escape | Click edit icon on card -- textarea appears with existing comment, sidebar stays open. Modify text, blur -- "Saved" indicator appears, comment updates. Click edit again, press Escape -- original text restored, no save. |
| AC-011 | FC-014 | Sidebar footer no longer contains export buttons; sidebar header has "Share / Export" | Open sidebar. Verify: no Markdown/ZIP buttons in footer. "Share / Export" button in header area opens the export dialog. |
| AC-012 | FC-015 | Toast messages rotate and milestones appear at 5 and 10 | Submit 10 feedback items. Verify: (a) at least 2 different toast messages appear in the first 5 submissions, (b) sidebar shows "Thorough review!" at count 5, (c) sidebar shows "Detailed review!" at count 10. |

## 9. Risks and Open Questions

| ID | Type | Description | Mitigation | Status |
| --- | ---- | ----------- | ---------- | ------ |
| R-001 | UX | Undo toast may overlap with success toast if user deletes immediately after submitting feedback | Toast system should stack or replace: undo toast takes priority over success toast since it is time-critical | Open |
| R-002 | Technical | Inline edit auto-save on blur may conflict with Escape keydown listener if blur fires before keydown | Escape handler should set a cancel flag that the blur handler checks before saving | Open |
| R-003 | UX | Removing sidebar footer export buttons is a breaking change for users who learned that workflow | Unified export via header button is more discoverable; monitor for user confusion | Accepted |
| R-004 | Technical | "Copy all to clipboard" requires Clipboard API permission which may fail in some contexts | Fall back to document.execCommand('copy') or show error toast | Open |
| Q-001 | Design | Should the empty state SVG be a custom illustration or a simple icon from the existing icon set? | Recommend: simple icon (e.g., clipboard or chat bubble) from existing icon utilities to avoid asset management complexity | Open |
| Q-002 | Design | Should milestone messages (F-26) include confetti animation at 10 items, or text-only? | Recommend: text-only for Phase 2; confetti is attractive but adds complexity and may feel out of place without broader brand personality work | Open |
| Q-003 | Scope | F-09 proposes moving "Clear all" to the sidebar footer (replacing export buttons). Should Clear all remain in its current location or move to the footer? | Recommend: keep Clear all in its current demoted location (Phase 1 moved it out of FAB menu). Footer could show item count or be removed entirely. | Open |
