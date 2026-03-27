# Phase BRD: Fix Critical UX Issues

status: not_started
phase_key: phase-1-fix-critical-ux-issues
phase_number: 1
last_updated: 2026-03-27

## 1. Context Intake

| Source | Relevance | Notes |
| ------ | --------- | ----- |
| .audit/ux/04-audit.md | Primary | Full UX audit with WCAG violations, heuristic scores, and interaction analysis |
| .audit/ux/05-proposals.md | Primary | Detailed proposals with code skeletons and acceptance criteria for all 17 findings |
| Codebase pattern scan | Primary | Confirmed zero ARIA attributes, zero :focus-visible styles, zero prefers-reduced-motion, and all label/copy issues across extension UI files |

## 2. Problem Statement

The Feedbacker Chrome extension has 17 discrete UX deficiencies spanning WCAG accessibility violations (Level A and AA), confusing jargon labels, missing system feedback, and discoverability gaps. These issues collectively degrade the experience for keyboard-only users (no focus indicators, no ARIA semantics, no live regions), confuse non-technical reviewers (developer vocabulary in labels), and leave all users uncertain about system state (no submit confirmation, no draft save indicator, destructive action too prominent). Each deficiency is low-to-trivial effort and independently shippable.

## 3. Goals and Non-Goals

### Goals

1. Achieve WCAG 2.2 Level AA compliance for all extension UI components (modal, sidebar, FAB, export dialog, minimized state)
2. Replace all developer-facing jargon labels with plain-language, action-oriented text
3. Provide visible system feedback for submit, draft save, and clipboard copy actions
4. Reduce accidental destructive action risk by relocating "Clear all" away from primary actions
5. Improve first-use discoverability with a coach mark and visible keyboard shortcut
6. Communicate the local-data privacy advantage to users

### Non-Goals

- **Undo toast for single-item delete (F-03):** Not in the brief. Requires state management changes beyond quick-win scope.
- **Export success feedback (F-13):** Not in the brief. Deferred to a future phase.
- **Keyboard-accessible element selection (F-19 full scope):** Listed in brief as a WCAG a11y fix, but the full implementation (Tab/arrow key DOM traversal) is rated High effort and L4 complexity. This phase covers only the ARIA and focus-visible foundations. Full keyboard selection is deferred.
- **Inline card editing, search/sort in sidebar, animation entrance/exit:** Strategic improvements outside quick-win scope.
- **React widget (packages/feedbacker) changes:** This phase scopes exclusively to the Chrome extension package.

## 4. Scope Definition

### Files in Scope

| File | Findings Addressed |
| ---- | ------------------ |
| packages/extension/src/ui/modal.ts | F-06, F-10, F-18, F-21 |
| packages/extension/src/ui/fab.ts | F-04, F-07, F-12, F-21 |
| packages/extension/src/ui/sidebar.ts | F-04, F-21, F-29, F-32 |
| packages/extension/src/ui/app.ts | F-01, F-02, F-22 |
| packages/extension/src/ui/export-dialog.ts | F-04, F-21 |
| packages/extension/src/ui/minimized-state.ts | F-30 |
| packages/extension/src/styles/extension-css.ts | F-20, F-23, F-24 |
| packages/extension/popup/popup.html | F-12, F-28 |
| packages/extension/src/popup/popup.ts | F-12 |

### Deliverables

| # | Deliverable | Finding(s) |
| - | ----------- | ---------- |
| D-1 | Plain-language labels across FAB, sidebar, export dialog, and modal | F-04 |
| D-2 | Cmd/Ctrl+Enter submit with hint text | F-06 |
| D-3 | "Clear all" relocated from FAB menu to sidebar footer | F-07 |
| D-4 | Draft save indicator in modal | F-10 |
| D-5 | Keyboard shortcut shown in popup and FAB tooltip | F-12 |
| D-6 | ARIA label on modal textarea | F-18 |
| D-7 | :focus-visible styles on all interactive elements | F-20 |
| D-8 | ARIA roles on modal, sidebar, FAB, export dialog | F-21 |
| D-9 | ARIA live region for status announcements | F-22 |
| D-10 | Muted text contrast fix (light and dark mode) | F-23 |
| D-11 | prefers-reduced-motion support | F-24 |
| D-12 | Privacy trust signal in popup | F-28 |
| D-13 | aria-label on all icon-only buttons | F-29 |
| D-14 | Minimized state discard button target size increase | F-30 |
| D-15 | Screenshot copy button always visible | F-32 |
| D-16 | First-use coach mark on FAB | F-01 |
| D-17 | Submit success toast | F-02 |

## 5. Functional Capability Contract

| FC ID | Actor | Preconditions | User Action | System Response | Not Allowed | Error Mapping | Evidence Target |
| ----- | ----- | ------------- | ----------- | --------------- | ----------- | ------------- | --------------- |
| FC-001 | Any user | FAB menu is open | Reads FAB menu labels | Menu displays "New feedback", "View feedback (N)", and "Share / Export". "Clear all" is absent from the menu. | "Show manager", "Export", or "Clear all" must not appear in FAB menu with old wording/placement | N/A | Screenshot of FAB menu showing new labels |
| FC-002 | Any user | Sidebar is open with feedback cards | Reads card action tooltip | Copy button tooltip reads "Copy to clipboard" (not "Copy markdown") | "Copy markdown" must not appear as tooltip text anywhere | N/A | Inspect tooltip text on card copy button |
| FC-003 | Any user | Export dialog is open | Reads ZIP option description | ZIP description reads "Full report with screenshots" (not "Complete export with images and JSON data") | "JSON data" must not appear in any user-facing label | N/A | Screenshot of export dialog |
| FC-004 | Any user | Modal is open, component path is visible | Reads component path | Path is prefixed with label "Element location:" | Raw component path must not display without a label prefix | N/A | Screenshot of modal with component path |
| FC-005 | Any user | Modal is open, textarea has focus | Presses Enter key | A newline character is inserted into the textarea (default behavior) | Enter without modifier must not submit the form | N/A | Type multi-line text using Enter |
| FC-006 | Any user | Modal is open, textarea has non-empty content | Presses Cmd+Enter (macOS) or Ctrl+Enter (Windows/Linux) | Form submits the feedback | Submission must not occur on Enter alone or Shift+Enter | N/A | Submit via keyboard shortcut |
| FC-007 | Any user | Modal is open | Looks at submit button area | OS-appropriate hint text is visible (e.g., "Cmd+Enter to submit" on macOS, "Ctrl+Enter to submit" on Windows/Linux) | Hint must not show wrong modifier for the user's OS | N/A | Screenshot of modal footer |
| FC-008 | Any user | Sidebar is open | Looks at sidebar footer | "Clear all" button appears in sidebar footer, styled with error/red color. Existing confirmation dialog is preserved when clicked. | "Clear all" must not appear in the FAB menu. Must not delete without confirmation dialog. | N/A | Screenshot of sidebar footer with Clear all |
| FC-009 | Any user | Modal is open, user has typed text, 2s of inactivity passes | Draft auto-save triggers | "Draft saved" indicator text appears briefly below textarea or in footer, then fades out | Indicator must not persist indefinitely. Must not interfere with typing or layout. | N/A | Observe draft saved indicator after pause |
| FC-010 | Any user | Popup is open | Looks below "Start Capturing" button | Keyboard shortcut is displayed with OS-appropriate modifier (Alt+Shift+F or Opt+Shift+F) | Must not show raw "Alt+Shift+F" on macOS | N/A | Screenshot of popup |
| FC-011 | Any user | FAB is visible on page | Hovers over FAB | FAB displays title/tooltip including the keyboard shortcut | FAB must not lack a tooltip entirely | N/A | Hover FAB and observe tooltip |
| FC-012 | Screen reader user | Modal textarea receives focus | Screen reader announces element | Textarea is announced as "Feedback description" (via aria-label) | Textarea must not be announced as an unlabeled input | N/A | Screen reader audit of modal |
| FC-013 | Keyboard user | Any interactive element in extension UI | Navigates to element via Tab key | A visible focus ring (box-shadow) appears on the focused element. Ring does not appear on mouse click. | Focus indicator must not be absent on any .fb-btn, .fb-btn-icon, .fb-fab, .fb-fab-action, or .fb-export-option element when focused via keyboard | N/A | Tab through all interactive elements |
| FC-014 | Screen reader user | Modal is rendered | Screen reader enters modal | Modal is announced as a dialog (role="dialog", aria-modal="true", aria-label) | Modal must not lack dialog role or modal semantics | N/A | Screen reader audit |
| FC-015 | Screen reader user | Sidebar is rendered | Screen reader navigates to sidebar | Sidebar is announced as a complementary landmark with aria-label | Sidebar must not lack landmark role | N/A | Screen reader audit |
| FC-016 | Screen reader user | FAB is rendered | Screen reader navigates to FAB | FAB button has aria-label. aria-expanded toggles between "true" and "false" on expand/collapse. Badge has descriptive aria-label. | FAB must not lack aria-label. aria-expanded must not be static. | N/A | Screen reader audit of FAB states |
| FC-017 | Screen reader user | Sidebar filter tabs are rendered | Screen reader navigates to filter area | Filter bar has role="tablist". Each tab has role="tab" with aria-selected reflecting active state. | Tabs must not lack tablist/tab roles | N/A | Screen reader audit of filter tabs |
| FC-018 | Screen reader user | User performs submit, copy, or delete action | Action completes | ARIA live region (role="status", aria-live="polite") announces the action result (e.g., "Feedback saved", "Copied to clipboard", "Feedback deleted") | Status changes must not be silent to assistive technology | N/A | Screen reader hears announcement |
| FC-019 | Any user | Extension renders in light mode | Views muted text (timestamps, empty states) | Muted text color meets minimum 4.5:1 contrast ratio against white background | Contrast ratio must not be below 4.5:1 for any muted text at normal size | N/A | Contrast checker measurement |
| FC-020 | Any user | Extension renders in dark mode | Views muted text | Muted text color meets minimum 4.5:1 contrast ratio against dark background | Contrast ratio must not be below 4.5:1 for any muted text at normal size | N/A | Contrast checker measurement |
| FC-021 | User with reduced motion preference | OS-level "reduce motion" is enabled | Interacts with any extension UI | All CSS transitions and animations are disabled or reduced to 0ms duration | Animations must not play when prefers-reduced-motion: reduce is active | N/A | Enable reduced motion in OS, interact with extension |
| FC-022 | Any user | Popup is open | Reads settings section | A concise privacy message is visible (e.g., "Your feedback stays local -- nothing leaves your browser.") | Privacy message must not be absent from the popup | N/A | Screenshot of popup settings area |
| FC-023 | Screen reader user | Sidebar card is rendered with icon-only buttons | Screen reader navigates to card action buttons | Each icon-only button (edit, copy, delete, copy screenshot) has aria-label matching its visible tooltip text | Icon-only buttons must not lack aria-label | N/A | Screen reader audit of card actions |
| FC-024 | Any user | Minimized state bar is visible | Clicks the discard button | Discard button target area is at least 24x24px | Button target must not be below 24x24px (WCAG 2.5.8 minimum) | N/A | Measure rendered button dimensions |
| FC-025 | Any user | Sidebar is open with cards that have screenshots | Views card actions row | Screenshot copy button is always visible in the card actions row (not hidden behind hover) | Copy-image button must not require hover to discover. Button must have aria-label="Copy screenshot". | N/A | Screenshot of card without hovering |
| FC-026 | First-time user | Extension activated for the first time (onboardingShown flag not set) | FAB appears on page | Coach mark tooltip appears adjacent to FAB with text "Click to start giving feedback". FAB shows a pulse animation. Tooltip dismisses on click or after 8 seconds. onboardingShown flag is persisted. | Coach mark must not appear on subsequent activations. Must not block interaction with the FAB. | Storage write fails: coach mark still dismisses, flag not persisted, coach mark may reappear next session | Check first activation shows tooltip; refresh and confirm it does not reappear |
| FC-027 | Any user | Feedback has been submitted successfully | Submission completes | Toast notification appears near FAB showing checkmark icon and "Feedback saved!" text. Toast auto-dismisses after 3.5 seconds. Toast has role="status" for screen reader announcement. Badge count animates briefly. | Toast must not persist indefinitely. Modal must not close silently without any feedback. | N/A | Submit feedback and observe toast |
| FC-028 | Screen reader user | Export dialog is rendered | Screen reader enters export dialog | Export dialog modal has role="dialog" and aria-modal="true" | Export dialog must not lack dialog semantics | N/A | Screen reader audit of export dialog |

## 6. User Can / User Cannot

### User Can

- Read all UI labels in plain, non-technical language
- Submit feedback using Cmd/Ctrl+Enter and see the correct shortcut hint for their OS
- Use Enter key to insert newlines in the feedback textarea
- See a "Draft saved" indicator when the auto-save fires
- See and use "Clear all" in the sidebar footer (with confirmation dialog)
- Discover the keyboard shortcut (Alt/Opt+Shift+F) from both the popup and the FAB tooltip
- Navigate all interactive elements via keyboard and see visible focus indicators
- Use a screen reader to navigate and understand all extension components (dialog roles, landmark roles, tab roles, button labels, live region announcements)
- View muted text at sufficient contrast in both light and dark modes
- Use the extension with OS-level reduced motion enabled and see no animations
- Read a privacy reassurance message in the popup
- Always see the screenshot copy button on cards without needing to hover
- See a coach mark on first use that explains what the FAB does
- See a success toast after submitting feedback
- Click the discard button on the minimized state bar comfortably (24x24px+ target)

### User Cannot

- Submit the form by pressing Enter alone (prevents accidental submission)
- Access "Clear all" from the FAB menu (prevents accidental destructive action near primary actions)
- Trigger the first-use coach mark more than once (persisted flag)
- Dismiss the submit toast manually (it auto-dismisses; no close button needed)
- See CSS animations when reduced motion preference is enabled
- See muted text below 4.5:1 contrast ratio

## 7. E2E User Test Flows

### Flow 1: Capture and Submit Feedback (Happy Path)

**Preconditions:** Extension is activated on a page. FAB is visible.

| Step | User Action | Expected Outcome |
| ---- | ----------- | ---------------- |
| 1 | Click FAB | Menu expands showing "New feedback", "View feedback (N)", "Share / Export" -- no "Clear all" |
| 2 | Click "New feedback" | Selection mode activates (crosshair cursor) |
| 3 | Click a page element | Modal appears with screenshot, component name, "Element location:" label on path, and textarea with aria-label |
| 4 | Type multi-line text using Enter key | Each Enter inserts a newline (no accidental submission) |
| 5 | Pause typing for 2+ seconds | "Draft saved" indicator appears briefly |
| 6 | Press Cmd+Enter (macOS) or Ctrl+Enter (Win/Linux) | Modal closes. Toast appears near FAB: checkmark + "Feedback saved!". Badge count animates. |
| 7 | Wait 3.5 seconds | Toast auto-dismisses |

**Error Paths:**
- Step 6 with empty textarea: Submit does not fire; button remains disabled
- Step 3 screenshot capture fails: Modal appears without screenshot; no error shown to user

### Flow 2: First-Use Onboarding

**Preconditions:** Extension activated for the very first time (clean install, no onboardingShown flag).

| Step | User Action | Expected Outcome |
| ---- | ----------- | ---------------- |
| 1 | Extension activates | FAB appears with pulse animation. Coach mark tooltip appears: "Click to start giving feedback" |
| 2 | Click FAB (or wait 8 seconds) | Coach mark dismisses. FAB menu opens (if clicked). |
| 3 | Navigate to another page, extension activates again | FAB appears without coach mark (flag persisted) |

**Error Paths:**
- chrome.storage.local write fails: Coach mark dismisses normally but may reappear on next session

### Flow 3: Keyboard Navigation Through Extension UI

**Preconditions:** Extension is activated. User navigates exclusively via keyboard.

| Step | User Action | Expected Outcome |
| ---- | ----------- | ---------------- |
| 1 | Tab to FAB | Visible focus ring appears on FAB |
| 2 | Press Enter on FAB | Menu expands. FAB aria-expanded="true" |
| 3 | Tab through menu items | Each .fb-fab-action shows visible focus ring |
| 4 | Press Enter on "View feedback" | Sidebar opens. Sidebar has role="complementary" and aria-label. Close button has focus. |
| 5 | Tab through sidebar | Filter tabs have role="tab" with aria-selected. Card action buttons each announce their aria-label. |
| 6 | Tab to card copy button, press Enter | Clipboard copy executes. ARIA live region announces "Copied to clipboard". |
| 7 | Press Escape | Sidebar closes. Focus returns to previous position. |

**Error Paths:**
- Clipboard write fails: Fallback to text copy; live region still announces

### Flow 4: Manage Feedback and Clear All (Relocated)

**Preconditions:** Extension has 3+ feedback items. Sidebar is open.

| Step | User Action | Expected Outcome |
| ---- | ----------- | ---------------- |
| 1 | Scroll to sidebar footer | "Clear all" button is visible, styled in red/error color |
| 2 | Click "Clear all" | Confirmation dialog appears: "Clear all feedback?" with "Delete all" button |
| 3 | Click "Delete all" | All feedback deleted. Sidebar updates to empty state. Badge count resets. |

**Error Paths:**
- Step 2 click "Cancel": Dialog closes, no data deleted

### Flow 5: Popup Discoverability and Privacy

**Preconditions:** User clicks the extension toolbar icon to open the popup.

| Step | User Action | Expected Outcome |
| ---- | ----------- | ---------------- |
| 1 | Reads popup content | Below "Start Capturing" button, keyboard shortcut is visible (OS-appropriate: "Opt+Shift+F" on macOS or "Alt+Shift+F" on Windows) |
| 2 | Scrolls to settings section | Privacy message visible: "Your feedback stays local -- nothing leaves your browser." |

### Flow 6: Reduced Motion and Contrast

**Preconditions:** User has enabled "Reduce motion" in OS accessibility settings.

| Step | User Action | Expected Outcome |
| ---- | ----------- | ---------------- |
| 1 | Activate extension and interact with FAB | FAB hover has no scale transition. Menu items appear without translateX animation. |
| 2 | Submit feedback | Toast appears without slide-up animation (instant appear/disappear or opacity-only) |
| 3 | (Separate test) View card timestamp in light mode | Muted text color is #6b7280 or darker (>= 4.5:1 on white) |
| 4 | (Separate test) View card timestamp in dark mode | Muted text color is #d1d5db or lighter (>= 4.5:1 on #1f2937) |

## 8. Acceptance Criteria

| AC ID | Covers FC | Criterion | Validation Signal |
| ----- | --------- | --------- | ----------------- |
| AC-001 | FC-001, FC-002, FC-003, FC-004 | All five jargon labels are replaced with plain-language equivalents | Grep extension UI source files for "Show manager", "Copy markdown", "JSON data", raw component path without "Element location:" label -- zero matches |
| AC-002 | FC-005, FC-006, FC-007 | Enter inserts newline; Cmd/Ctrl+Enter submits; OS-appropriate hint is visible | Manual test: type Enter in textarea produces newline. Cmd+Enter on macOS submits. Ctrl+Enter on Windows submits. Hint text visible near Submit button. |
| AC-003 | FC-008 | "Clear all" removed from FAB menu and present in sidebar footer with red styling and confirmation dialog | Grep fab.ts for "Clear all" -- zero matches. Grep sidebar.ts for "Clear all" -- one match in footer section. Click "Clear all" in sidebar footer -- confirmation dialog appears. |
| AC-004 | FC-009 | Draft save indicator appears after auto-save and fades out | Open modal, type text, wait 2+ seconds. "Draft saved" text appears and fades within ~2 seconds. |
| AC-005 | FC-010, FC-011 | Keyboard shortcut visible in popup and FAB tooltip | Open popup -- shortcut text visible below "Start Capturing". Hover FAB -- tooltip includes shortcut. OS-appropriate modifier shown. |
| AC-006 | FC-012 | Modal textarea has programmatic label | Inspect textarea element -- aria-label="Feedback description" present |
| AC-007 | FC-013 | All interactive element classes have :focus-visible styles | Grep extension-css.ts for ":focus-visible" -- matches for .fb-btn, .fb-btn-icon, .fb-fab, .fb-fab-action, .fb-export-option. Tab through all elements -- visible focus ring on each. Mouse click -- no focus ring. |
| AC-008 | FC-014, FC-015, FC-016, FC-017, FC-028 | All custom components have correct ARIA roles and states | Modal: role="dialog", aria-modal="true", aria-label. Sidebar: role="complementary", aria-label. FAB: aria-label, aria-expanded toggles. Badge: aria-label. Tabs: role="tablist", role="tab", aria-selected. Export dialog: role="dialog", aria-modal="true". |
| AC-009 | FC-018 | ARIA live region announces status changes | Submit feedback -- screen reader announces "Feedback saved". Copy item -- announces "Copied to clipboard". Delete item -- announces "Feedback deleted". |
| AC-010 | FC-019, FC-020 | Muted text contrast meets 4.5:1 in both modes | Light mode: --fb-text-muted is #6b7280 or darker (5.0:1 on white). Dark mode: --fb-text-muted is #d1d5db or lighter (>= 4.5:1 on #1f2937). |
| AC-011 | FC-021 | All transitions disabled when prefers-reduced-motion: reduce is active | Grep extension-css.ts for "prefers-reduced-motion" -- one match. Enable reduced motion in OS -- no CSS transitions or animations play on any extension element. |
| AC-012 | FC-022 | Privacy message present in popup | Open popup -- text "Your feedback stays local" (or equivalent) is visible in settings area |
| AC-013 | FC-023 | All icon-only buttons have aria-label matching tooltip | Inspect sidebar card buttons: editBtn aria-label="Edit feedback", copyBtn aria-label="Copy to clipboard", deleteBtn aria-label="Delete feedback", screenshotCopyBtn aria-label="Copy screenshot". Inspect modal close/minimize buttons, sidebar close button, export dialog close button -- all have aria-label. |
| AC-014 | FC-024 | Minimized state discard button target >= 24x24px | Inspect discard button computed dimensions -- width and height >= 24px |
| AC-015 | FC-025 | Screenshot copy button always visible on cards | Open sidebar with screenshot cards -- copy-image button is visible in card actions row without hovering |
| AC-016 | FC-026 | First-use coach mark appears once and persists flag | Fresh install: activate extension -- coach mark appears. Click FAB or wait 8s -- coach mark dismisses. Check chrome.storage.local -- onboardingShown is true. Activate again -- no coach mark. |
| AC-017 | FC-027 | Submit success toast appears with correct content and auto-dismisses | Submit feedback -- toast with checkmark and "Feedback saved!" appears near FAB. Toast has role="status". Badge animates. After 3.5s, toast disappears. |

## 9. Risks and Open Questions

| ID | Type | Description | Mitigation | Status |
| --- | ---- | ----------- | ---------- | ------ |
| R-001 | Risk | F-19 (keyboard element selection) is listed in the brief but is High effort / L4 complexity. Full implementation is a strategic investment, not a quick win. | Phase 1 delivers the ARIA and focus-visible foundation only. Full keyboard selection deferred to a later phase. Brief updated to reflect partial scope. | Open |
| Q-001 | Question | Should the coach mark tooltip position adapt to all four FAB positions (top-left, top-right, bottom-left, bottom-right)? | Proposal assumes bottom-right default. Position-aware placement recommended but may add complexity. | Open |
| Q-002 | Question | Should the "Clear all" button in the sidebar footer be hidden when the sidebar shows zero items? | Recommend hiding it (consistent with current behavior where FAB export does nothing with 0 items). | Open |
| Q-003 | Question | Does the submit success toast need a close button for users who find it distracting? | Proposal says auto-dismiss only. A close button could be added if user feedback warrants it. | Open |
| R-002 | Risk | Shadow DOM may suppress browser default focus indicators, making :focus-visible styles essential rather than optional. | Custom :focus-visible styles are mandatory for all interactive classes within the shadow DOM. Testing must verify focus visibility inside shadow root. | Mitigated |

---

Instructions: See SKILL.md Step 2 for authoring rules. FC rows must be atomic capability contracts. E2E flows required for user-facing phases. Run verify-traceability before advancing.
