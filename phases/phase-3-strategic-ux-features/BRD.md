# Phase BRD: Strategic UX Features

status: not_started
phase_key: phase-3-strategic-ux-features
phase_number: 3
last_updated: 2026-03-27

## 1. Context Intake

| Source | Relevance | Notes |
| ------ | --------- | ----- |
| .audit/ux/04-audit.md | High | Findings F-05, F-11, F-17, F-19, F-34, F-35 -- original audit observations with severity, frequency, and JTBD mapping |
| .audit/ux/05-proposals.md | High | Detailed proposals for each finding including before/after, code skeletons, and acceptance criteria |
| .audit/ux/01-user-goals.md | High | JTBD statements J-001 through J-007 and persona definition; six features map to J-002, J-005, J-006, J-007 |
| .audit/ux/03-patterns.md | Medium | UX patterns and competitive analysis informing proposal design |
| packages/core/src/types.ts | High | Feedback and ComponentInfo data models that must be extended for type categorization and element selector storage |
| packages/extension/src/core/detection-controller.ts | High | Current mouse-only selection mode that must be extended for keyboard access and scroll-wheel granularity |
| packages/extension/src/ui/overlay.ts | High | ComponentOverlayUI showing technical names in tooltip -- must adopt human-readable names |
| packages/extension/src/ui/sidebar.ts | High | ManagerSidebar with no search, sort, or navigate-to-element capability |
| packages/extension/src/ui/modal.ts | High | FeedbackModal with no type categorization chips |
| packages/detection/src/types.ts | Medium | ComponentInfo interface (name, path, element) -- element reference not persisted after capture |
| packages/core/src/export/markdown-exporter.ts | Medium | Export format must include feedback type once F-34 ships |

## 2. Problem Statement

The Feedbacker extension provides a functional capture-and-review loop, but six strategic gaps limit its utility for non-technical reviewers and power users alike:

1. **Element names are developer jargon** (F-05): Tooltips and modal headers show raw component names ("NavButton", "div.hero-section") and fiber paths ("App > Header > Nav"). Non-technical reviewers -- designers, PMs, clients -- cannot interpret these, undermining confidence in element identification (J-005, outcome 3-4).

2. **No search or sort in sidebar** (F-11): The sidebar lists all feedback chronologically with only a site filter. Users with 10+ items must scroll through every card to locate a specific piece of feedback (J-002, outcome 1).

3. **No element selection granularity** (F-17): Selection mode locks to whichever element the mouse is directly over. Users cannot navigate to a parent container or child element, leading to frequent wrong-element captures (J-005).

4. **No feedback type categorization** (F-34): The modal has only a free-text comment field. The entire job J-006 (Categorize and prioritize feedback) is unserved. Reviewers who want structure resort to manual "[BUG]" prefixes.

5. **No navigate-from-card-to-element** (F-35): Clicking a feedback card in the sidebar does nothing to the page. The original element reference is not stored. Users cannot verify feedback in context (J-007, entirely unserved).

6. **Element selection is mouse-only** (F-19): Selection mode cannot be operated via keyboard, violating WCAG 2.1.1 Level A. Keyboard-only and assistive technology users are excluded from the core capture flow (J-001, J-005).

## 3. Goals and Non-Goals

### Goals

- G-1: Non-technical users can understand element identities without interpreting developer jargon
- G-2: Users with 5+ feedback items can locate specific items via text search and sort order
- G-3: Users can refine element selection to target parents or children of the initially-hovered element
- G-4: Users can classify feedback by type (Bug, Suggestion, Question) during capture
- G-5: Users can navigate from a sidebar card to the original element on the page
- G-6: Keyboard-only users can complete the full element selection flow without a mouse

### Non-Goals

- Severity/priority fields beyond the optional Bug severity dropdown (defer to future phase based on adoption of type chips)
- Project management tool integrations (F-36, deferred -- Very High effort, separate phase)
- Inline card editing in sidebar (F-08, addressed independently if not already shipped)
- Annotation/drawing tools on screenshots (competitive feature, out of scope)
- Collaborative/multi-user review sessions
- Onboarding/first-use guidance (F-16 selection banner already shipped in phase 2)
- React widget (`feedbacker-react`) parity -- this phase targets the Chrome extension; the React widget will adopt changes through shared packages (`@feedbacker/core`, `@feedbacker/detection`) but React-widget-specific UI work is not in scope

## 4. Scope Definition

### Affected Packages

| Package | Scope |
|---------|-------|
| `@feedbacker/core` | `types.ts` -- extend `Feedback` with `type`, `severity`, `elementSelector` fields; `markdown-exporter.ts` and `zip-exporter.ts` -- include type in export output |
| `@feedbacker/detection` | `types.ts` -- no structural change needed; detection strategies may gain a human-readable name utility |
| `@feedbacker/extension` | `overlay.ts`, `modal.ts`, `sidebar.ts`, `detection-controller.ts`, `app.ts`, `extension-css.ts` -- primary UI changes; new utility for human-readable name resolution, CSS selector generation |

### Codebase Pattern Analysis

**F-05 (human-readable names):** Component name display appears in `overlay.ts` (tooltip text on line 58-60), `modal.ts` (header h3 on line 52, aria-label on line 40), `minimized-state.ts` (component name display), and sidebar cards in `sidebar.ts`. All four surfaces must adopt the human-readable name resolution. The detection bridge (`detection-bridge.ts`) and detection strategies produce names consumed by these surfaces.

**F-11 (search/sort):** The sidebar is entirely in `sidebar.ts` with no search or sort mechanism. The sidebar receives `feedbacks: Feedback[]` and renders cards. Search and sort operate on this array before rendering.

**F-17 (selection granularity):** Element selection is handled in `detection-controller.ts` (mousemove, click handlers). Scroll-wheel events are not captured. The overlay in `overlay.ts` follows the hovered element. Both files need scroll-wheel handling.

**F-19 (keyboard selection):** `detection-controller.ts` only listens for `mousemove` and `click` on the document. The only keyboard handler is Escape to deactivate. Tab/arrow-key navigation must be added. This interacts with F-17 (arrow keys as accessible alternative to scroll-wheel).

**F-34 (type categorization):** `modal.ts` has no type selection UI. The `Feedback` interface in `core/types.ts` has no `type` field. `markdown-exporter.ts` does not reference type. `sidebar.ts` card rendering has no type badge. The `FeedbackStore` and `Draft` interfaces may also need extension.

**F-35 (navigate to element):** `Feedback` interface has no `elementSelector` field. `sidebar.ts` card click does not trigger any page navigation. `overlay.ts` `show()` method accepts `ComponentInfo` which requires a live `element` reference. A new mechanism is needed to re-locate elements from stored selectors.

### Deliverables

| ID | Deliverable | Description |
|----|------------|-------------|
| D-1 | Human-readable name resolution | Name resolution chain producing human-readable names from aria-label, visible text, role, then falling back to component/tag names; progressive disclosure toggle for technical details in modal |
| D-2 | Sidebar search and sort | Search input filtering cards by comment, element name, and URL; sort toggle for newest/oldest first |
| D-3 | Scroll-wheel element granularity | Scroll-wheel parent/child navigation during selection mode; breadcrumb trail showing DOM position |
| D-4 | Feedback type categorization | Chip bar in modal (Bug/Suggestion/Question); type stored in data model; type badge on sidebar cards; type in exports |
| D-5 | Navigate from card to element | CSS selector stored during capture; click sidebar card to scroll-to and highlight element; graceful fallback when element not found |
| D-6 | Keyboard-accessible selection | Tab/Shift+Tab to cycle focusable elements; arrow keys for sibling navigation; Enter to confirm; overlay follows keyboard focus |

## 5. Functional Capability Contract

| FC ID | Actor | Preconditions | User Action | System Response | Not Allowed | Error Mapping | Evidence Target |
| ----- | ----- | ------------- | ----------- | --------------- | ----------- | ------------- | --------------- |
| FC-001 | Reviewer | Selection mode active; mouse hovering over a page element | Hovers over any page element | Overlay tooltip displays a human-readable name derived from the element's aria-label, visible text content, or role attribute. If no semantic name is available, falls back to component name or tag.class. | Must not display raw React component names (e.g., "NavButton") or fiber paths as the primary name when a human-readable alternative exists. Must not truncate names below a readable length (minimum 3 characters). | If name resolution fails entirely, display the tag name (e.g., "button", "div") rather than "Unknown". | Tooltip shows human-readable name on 3 test pages (React site, static HTML site, complex SPA). |
| FC-002 | Reviewer | Feedback modal is open after element selection | Views modal header | Modal header displays the human-readable element name. A toggle control labeled "Technical details" is available. Activating the toggle reveals the component name, component path, and HTML snippet. | Must not show technical details by default. Must not remove technical details entirely -- they must remain accessible via the toggle. | If component name is unavailable (non-React page), technical details section shows tag name and HTML snippet only. | Modal header shows human-readable name; toggle reveals technical info. |
| FC-003 | Reviewer | Sidebar is open with 1+ feedback items | Types text into a search input at the top of the sidebar | Cards are filtered in real-time to show only items whose comment text, element name, or URL contains the search term. Filtering is debounced. | Must not filter on fields not visible to the user (e.g., internal IDs, raw HTML snippets). Must not clear the search input when switching between "This site" and "All sites" filter tabs. | If no items match, display a "No matching feedback" message with the search term. | Search returns matching cards within 300ms debounce; non-matching cards hidden. |
| FC-004 | Reviewer | Sidebar is open with 2+ feedback items | Activates a sort toggle | Card order switches between newest-first (default) and oldest-first. Sort order persists across sidebar open/close within the same session. | Must not add more than two sort options in this phase (newest/oldest only). Must not re-sort while the user is actively editing a card inline. | No error states -- sort always succeeds on the client-side array. | Cards reorder when sort toggle is activated. |
| FC-005 | Reviewer | Selection mode active; mouse hovering over an element | Scrolls mouse wheel up | Overlay moves to the parent element of the currently highlighted element. Tooltip updates to show the parent's name. Breadcrumb trail at the bottom of the viewport updates to reflect the new position. | Must not scroll the page while selection mode is active and a scroll-wheel event is captured. Must not navigate above the `<html>` element. Must not navigate to extension-injected elements (shadow DOM host, overlay). | If the current element has no parent (is `<html>`), the scroll-up event is ignored and the highlight remains on the current element. | Scroll-up moves highlight to parent on 3 test pages with varying DOM depth. |
| FC-006 | Reviewer | Selection mode active; overlay highlighting a container element | Scrolls mouse wheel down | Overlay moves to the first child element of the currently highlighted element. Tooltip and breadcrumb update. | Must not navigate into text nodes or script/style elements. Must not navigate into the extension's own shadow DOM. | If the current element has no child elements, the scroll-down event is ignored. | Scroll-down moves highlight to first child element. |
| FC-007 | Reviewer | Selection mode active | Views the bottom of the viewport | A breadcrumb trail is visible showing the DOM path from a meaningful ancestor to the currently highlighted element (e.g., "body > header > nav > button"). The currently highlighted element is visually distinguished in the breadcrumb. | Must not show more than 6 breadcrumb segments (truncate from the left with an ellipsis). Must not overlap with the selection mode instruction banner. | If the element is deeply nested, the breadcrumb truncates ancestor segments from the left. | Breadcrumb appears during selection mode and updates as highlight changes. |
| FC-008 | Reviewer | Feedback modal is open | Selects a feedback type chip (Bug, Suggestion, or Question) from the chip bar above the textarea | The selected chip is visually filled with the type's color. The type value is stored with the feedback when submitted. Default selection is "Suggestion". | Must not require type selection -- "Suggestion" is the default and requires zero clicks. Must not add more than 3 type options in this phase. Must not display severity options for Suggestion or Question types. | No error states -- chip selection is a simple toggle. | Chip bar renders with 3 options; selection state toggles visually. |
| FC-009 | Reviewer | Feedback modal is open; "Bug" type chip is selected | Views optional severity control | An optional severity dropdown or control appears with options: Critical, Major, Minor. Default is none (no severity). | Must not show severity for Suggestion or Question types. Must not make severity selection mandatory even when Bug is selected. | No error states. | Severity control appears only when Bug chip is selected. |
| FC-010 | Reviewer | Sidebar is open with feedback items that have type assigned | Views feedback cards | Each card displays a colored type badge indicating the feedback type (Bug in red, Suggestion in blue, Question in amber). | Must not display a badge for items without a type (pre-existing items from before this feature). Must not use color alone to convey type -- text label must be present. | Pre-existing feedback items without a type field render without a badge (backward compatible). | Sidebar cards show colored type badges. |
| FC-011 | Reviewer | Feedback is exported (Markdown or ZIP) and items have type assigned | Exports feedback | Each feedback item in the export includes the type as a prefix (e.g., emoji or text label before the comment). | Must not omit the type from exports when present. Must not change the export format for items without a type. | Items without a type export in the existing format (no prefix). | Exported Markdown includes type prefix for typed items. |
| FC-012 | Reviewer | Sidebar is open; viewing a feedback card captured on the current page | Clicks a feedback card (or a navigate/locate action on the card) | The page scrolls to the original element's position and the element is briefly highlighted with the blue selection overlay. The highlight auto-dismisses after a short duration. | Must not attempt navigation for feedback items captured on a different page/origin than the current page. Must not leave the highlight permanently visible. Must not close the sidebar when navigating to an element. | If the stored CSS selector no longer matches any element on the page (page changed), display a toast: "Element not found on this page." | Click card on same-page item; page scrolls to element and highlights it. |
| FC-013 | Reviewer | Feedback is being captured (element selected, about to store) | Selects an element and submits feedback | A CSS selector for the selected element is generated and stored alongside the existing feedback data (component name, path, screenshot, comment). | Must not store selectors that reference extension-injected elements. Must not store selectors that depend on dynamically-generated class names if more stable identifiers (ID, data attributes) are available. | If selector generation fails, store the feedback without a selector (navigate-to-element will be unavailable for this item). | Stored feedback includes an elementSelector field. |
| FC-014 | Keyboard user | Selection mode is active (entered via keyboard activation of FAB > New feedback) | Presses Tab/Shift+Tab | Focus cycles through focusable page elements. The overlay highlight follows the currently focused element. | Must not trap focus permanently -- Escape must always exit selection mode. Must not interfere with the page's own Tab behavior outside of selection mode. Must not cycle through elements inside the extension's shadow DOM. | If no focusable elements exist on the page, display a toast or announce via live region: "No focusable elements found." | Tab cycles through page elements with overlay following focus. |
| FC-015 | Keyboard user | Selection mode active; an element is highlighted via keyboard focus | Presses Arrow Up or Arrow Down | Focus and highlight move to the parent (up) or first child (down) element, matching the scroll-wheel granularity behavior. | Must not navigate to text nodes, script, or style elements. Must not navigate above `<html>`. | If no valid parent or child exists, the key press is ignored. | Arrow keys navigate DOM hierarchy during keyboard selection. |
| FC-016 | Keyboard user | Selection mode active; an element is highlighted via keyboard focus | Presses Enter | The highlighted element is selected, selection mode deactivates, and the feedback modal opens with the element's info and screenshot. | Must not submit the modal form -- Enter in selection mode only confirms element selection. | If screenshot capture fails for the selected element, proceed with element selection but omit the screenshot (existing error handling). | Enter confirms selection; modal opens with element info. |
| FC-017 | Reviewer | Type categorization chips are visible in modal | Navigates chips with keyboard | Arrow keys move between chip options. Enter or Space selects the focused chip. Focus indicator is visible on the active chip. | Must not allow chip navigation to escape the chip bar via arrow keys (wrap at boundaries). | No error states. | Chips navigable with arrow keys; focus indicator visible. |

## 6. User Can / User Cannot

### User Can

- See a human-readable element name (derived from aria-label, visible text, or role) in the overlay tooltip and modal header
- Toggle to view technical component details (name, path, snippet) in the modal
- Search feedback items by comment text, element name, or URL in the sidebar
- Sort feedback items by newest-first or oldest-first in the sidebar
- Scroll mouse wheel up/down during selection mode to navigate to parent/child elements
- See a breadcrumb trail of the DOM path during selection mode
- Select a feedback type (Bug, Suggestion, Question) via chips in the modal
- Optionally set severity (Critical, Major, Minor) when the type is Bug
- See type badges on sidebar feedback cards
- See type prefixes in exported Markdown and ZIP reports
- Click a sidebar card to scroll the page to and briefly highlight the original element (same-page items only)
- Use Tab/Shift+Tab to cycle through focusable elements during selection mode
- Use Arrow Up/Down to navigate parent/child elements during keyboard selection
- Press Enter to confirm element selection via keyboard
- Press Escape to exit selection mode (mouse or keyboard)
- Navigate type chips with arrow keys and select with Enter/Space

### User Cannot

- Remove the human-readable name to see only technical names as default (the toggle only adds technical details, it does not replace the human-readable name)
- Search by HTML snippet content, browser info, or internal metadata fields
- Sort by anything other than timestamp (no sort by type, element name, or URL)
- Use scroll-wheel granularity outside of selection mode (normal page scroll is unaffected)
- Add custom feedback types beyond Bug, Suggestion, and Question
- Set severity for Suggestion or Question types
- Navigate from a sidebar card to an element on a different page/origin than the currently open page
- Rely on element navigation for pages whose DOM has changed since capture (best-effort selector matching, graceful fallback)
- Use keyboard selection to focus on non-interactive/non-focusable elements directly (Tab only reaches focusable elements; Arrow keys provide DOM traversal for granularity)

## 7. E2E User Test Flows

### Flow 1: Human-Readable Names During Capture

**Preconditions:** Extension is active on a page with buttons that have visible text labels (e.g., "Submit Order").

**Steps:**
1. Activate selection mode via FAB > New feedback
2. Hover over a button element that has text content "Submit Order"
3. Observe the overlay tooltip
4. Click the element to select it
5. Observe the modal header
6. Activate the "Technical details" toggle in the modal

**Expected Outcomes:**
- Step 3: Tooltip shows "Submit Order" (not "NavButton" or "button.submit-btn")
- Step 5: Modal header shows "Submit Order"
- Step 6: Technical details section expands, revealing the component name (e.g., "NavButton"), component path, and HTML snippet

**Error Paths:**
- If the element has no text, no aria-label, and no role: tooltip shows tag.class fallback (e.g., "div.hero-section")
- If on a non-React page with no component info: technical details section shows tag name and HTML snippet only

---

### Flow 2: Search and Sort Feedback

**Preconditions:** Sidebar is open with 5+ feedback items, at least two with the word "button" in the comment.

**Steps:**
1. Locate the search input below the filter tabs
2. Type "button" into the search input
3. Observe the card list
4. Clear the search input
5. Activate the sort toggle to switch to oldest-first
6. Observe the card order

**Expected Outcomes:**
- Step 3: Only cards containing "button" in their comment, element name, or URL are shown
- Step 4: All cards reappear
- Step 6: Cards are now ordered oldest-first (earliest timestamp at top)

**Error Paths:**
- Typing a search term that matches no items: "No matching feedback" message appears
- Switching between "This site" / "All sites" tabs while a search is active: search filter persists and applies to the new tab's items

---

### Flow 3: Scroll-Wheel Element Granularity

**Preconditions:** Extension active on a page with nested elements (e.g., a button inside a nav inside a header).

**Steps:**
1. Activate selection mode
2. Hover over the innermost button element
3. Observe the breadcrumb trail at the bottom of the viewport
4. Scroll mouse wheel up once
5. Observe the overlay and breadcrumb
6. Scroll mouse wheel up again
7. Scroll mouse wheel down once
8. Click to select the currently highlighted element

**Expected Outcomes:**
- Step 3: Breadcrumb shows path ending with the button element, bolded
- Step 4-5: Overlay moves to the button's parent (e.g., "nav"); breadcrumb updates with "nav" bolded
- Step 6: Overlay moves to the nav's parent (e.g., "header")
- Step 7: Overlay moves back to "nav" (first child of header)
- Step 8: Modal opens with the "nav" element's info

**Error Paths:**
- Scrolling up when already at `<body>` or `<html>`: nothing happens, highlight stays
- Scrolling down on an element with no children: nothing happens
- Page does not scroll during any of these interactions

---

### Flow 4: Feedback Type Categorization

**Preconditions:** Selection mode activated; an element has been selected; the feedback modal is open.

**Steps:**
1. Observe the chip bar above the textarea
2. Note the default selection
3. Click the "Bug" chip
4. Observe any additional controls that appear
5. Select "Major" severity
6. Type a comment and submit
7. Open the sidebar and find the submitted card
8. Export feedback as Markdown

**Expected Outcomes:**
- Step 1: Three chips visible: Suggestion, Bug, Question
- Step 2: "Suggestion" is selected by default (filled background)
- Step 3: "Bug" chip becomes filled red; "Suggestion" chip becomes outlined
- Step 4: A severity control appears with options Critical, Major, Minor
- Step 7: The card shows a red "Bug" badge
- Step 8: The Markdown export includes a "Bug" prefix/indicator for this item

**Error Paths:**
- Submitting without changing the default: feedback is stored with type "suggestion" and no severity
- Switching from Bug to Suggestion after selecting severity: severity field is cleared/hidden

---

### Flow 5: Navigate From Card to Element

**Preconditions:** At least one feedback item captured on the current page. The element still exists on the page.

**Steps:**
1. Open the sidebar
2. Click on a feedback card for an item captured on this page
3. Observe the page

**Expected Outcomes:**
- Step 3: Page scrolls to the element's position. A blue highlight overlay appears on the element for approximately 3 seconds, then auto-dismisses. The sidebar remains open.

**Error Paths:**
- Element no longer exists on the page (DOM changed): a toast appears with "Element not found on this page"
- Feedback card is for a different site/origin: the navigate action is disabled or not shown for that card

---

### Flow 6: Keyboard-Accessible Element Selection

**Preconditions:** Extension is active. User is operating with keyboard only (no mouse).

**Steps:**
1. Focus the FAB using Tab
2. Activate FAB to expand the menu (Enter/Space)
3. Navigate to "New feedback" menu item (arrow keys or Tab)
4. Activate "New feedback" (Enter)
5. Selection mode activates; use Tab to cycle through focusable elements
6. Observe the overlay as focus moves
7. Use Arrow Up to navigate to the parent of the focused element
8. Press Enter to confirm selection
9. The feedback modal opens; use Tab to navigate to the type chips
10. Use arrow keys to move between type chips; press Enter to select "Bug"
11. Tab to the textarea, type a comment
12. Tab to the Submit button and press Enter

**Expected Outcomes:**
- Step 5-6: Overlay highlight follows the keyboard-focused element
- Step 7: Overlay moves to the parent element (same as scroll-wheel up)
- Step 8: Selection mode deactivates; modal opens with the element's info
- Step 10: Focus moves between chips; "Bug" is selected
- Step 12: Feedback is submitted with type "Bug"

**Error Paths:**
- Pressing Escape at any point during selection mode: selection mode deactivates, no modal opens
- No focusable elements on page: announcement via live region; user can use Arrow keys to traverse DOM

---

### Flow 7: Pre-Existing Feedback Backward Compatibility

**Preconditions:** Feedback items exist that were captured before phase 3 (no `type` or `elementSelector` fields).

**Steps:**
1. Open the sidebar
2. Observe cards for pre-existing items
3. Click on a pre-existing card
4. Export all feedback

**Expected Outcomes:**
- Step 2: Cards render normally without a type badge (no "undefined" or broken badge)
- Step 3: No navigation occurs (no selector stored); no error shown
- Step 4: Pre-existing items export in the original format without type prefix

## 8. Acceptance Criteria

| AC ID | Covers FC | Criterion | Validation Signal |
| ----- | --------- | --------- | ----------------- |
| AC-001 | FC-001, FC-002 | Overlay tooltip and modal header display human-readable names derived from aria-label, visible text, or role, with tag.class fallback when no semantic name is available. | On a test page with buttons containing text labels, tooltips show the text content (e.g., "Submit Order") instead of technical names. On elements without text/aria-label, tag.class appears. |
| AC-002 | FC-002 | Modal contains a "Technical details" toggle that reveals component name, component path, and HTML snippet. Technical details are hidden by default. | Open modal after selecting an element on a React page; header shows human-readable name; clicking toggle reveals component name and path. |
| AC-003 | FC-003 | Sidebar search input filters cards by comment text, element name, and URL with 300ms debounce. | Type a search term present in one card's comment; only matching cards remain visible within 500ms. Type a non-matching term; "No matching feedback" message appears. |
| AC-004 | FC-004 | Sidebar sort toggle switches between newest-first and oldest-first order. | With 3+ items of different timestamps, activate sort toggle; verify card order reverses. |
| AC-005 | FC-005, FC-006, FC-007 | Scroll-wheel up/down during selection mode navigates to parent/child elements. Breadcrumb trail shows DOM path with current element distinguished. Page does not scroll. | During selection mode, hover over a nested element and scroll up; overlay moves to parent. Scroll down; overlay moves to first child. Breadcrumb updates. Page scroll position unchanged. |
| AC-006 | FC-008, FC-009, FC-017 | Modal displays Bug/Suggestion/Question chip bar with "Suggestion" as default. Chips are keyboard-navigable. Bug selection reveals optional severity control. | Open modal; verify 3 chips visible, "Suggestion" selected. Click "Bug"; severity control appears. Navigate chips with arrow keys; focus indicator visible. |
| AC-007 | FC-010, FC-011 | Sidebar cards display colored type badges. Exported Markdown/ZIP includes type prefix. Pre-existing items without type render and export correctly. | Submit feedback with "Bug" type; sidebar card shows red "Bug" badge. Export to Markdown; verify "Bug" prefix present. View pre-existing item; no badge, no export change. |
| AC-008 | FC-012, FC-013 | Clicking a sidebar card for a same-page item scrolls to and highlights the original element. Highlight auto-dismisses. If element not found, toast appears. | Capture feedback, then click the card; page scrolls and element highlights. Navigate to a different page, return; if DOM changed, click card shows "Element not found" toast. |
| AC-009 | FC-014, FC-015, FC-016 | Full capture flow completable via keyboard only: Tab cycles focusable elements in selection mode, Arrow Up/Down navigates DOM hierarchy, Enter confirms selection, Escape exits. | Using keyboard only: activate selection mode, Tab to an element, press Enter; modal opens. Verify overlay followed focus throughout. Press Escape during selection mode; mode deactivates without modal. |
| AC-010 | FC-001, FC-002, FC-008, FC-010, FC-011, FC-012, FC-013 | Feedback items captured before phase 3 (without type or elementSelector fields) render correctly in the sidebar (no badge, no broken navigation), and export in the original format. | Load extension with pre-existing stored feedback; sidebar renders cards without errors; export includes all items in correct format. |

## 9. Risks and Open Questions

| ID | Type | Description | Mitigation | Status |
| --- | ---- | ----------- | ---------- | ------ |
| R-001 | Technical | Keyboard element selection may conflict with page keyboard shortcuts (F-19 risk from proposals). Tab/arrow key interception during selection mode could break pages with custom keyboard handling. | Use selection mode as a modal state that only intercepts keys when active. Provide clear Escape exit. Test on 10+ websites with keyboard shortcut libraries (e.g., Gmail, Notion, GitHub). | Open |
| R-002 | Technical | Stored CSS selectors may break when page content changes between capture and navigation (F-35 risk). Dynamic pages, SPAs with client-side routing, and pages with random class names reduce relocation success. | Generate robust selectors preferring unique IDs, data-testid/data-* attributes, and nth-child. Show graceful fallback toast. Never promise exact relocation in UI copy. | Open |
| R-003 | UX | Scroll-wheel hijacking during selection mode may confuse users who expect normal page scrolling (F-17 risk). | Show instruction in selection banner: "Scroll to refine selection." Only hijack scroll events during active selection mode. Provide arrow-key alternative. | Open |
| R-004 | UX | Adding type chips may slow down the capture flow for users who want maximum speed (F-34 risk). | Default to "Suggestion" so type selection adds zero clicks for users who ignore it. Monitor adoption rate -- if >90% use default after 1 month, consider making chips collapsible. | Open |
| R-005 | Data | Extending the Feedback interface with new fields (type, severity, elementSelector) requires backward compatibility with existing stored data. | New fields must be optional in the type definition. Rendering and export logic must handle items without these fields gracefully. Migration logic in `core/migrations.ts` may need a version bump. | Open |
| OQ-001 | Design | Should the navigate-to-element action be triggered by clicking anywhere on the card, or via a dedicated "locate" button/icon on the card? Clicking anywhere may conflict with future card interactions (e.g., expand/collapse). | Needs UX decision before implementation. Recommendation: dedicated locate icon to avoid conflict. | Open |
| OQ-002 | Design | Should the human-readable name resolution chain be implemented in `@feedbacker/detection` (shared across extension and React widget) or in the extension's overlay/modal code only? | If placed in detection, the React widget benefits automatically. Recommendation: implement in detection as a utility function. | Open |
| OQ-003 | Scope | Should the breadcrumb trail (F-17) be clickable to allow direct navigation to any ancestor in the path, or purely informational? | Clickable breadcrumbs add complexity. Recommendation: informational only in this phase; clickable as a follow-up enhancement. | Open |

---

Instructions: See SKILL.md Step 2 for authoring rules. FC rows must be atomic capability contracts. E2E flows required for user-facing phases. Run verify-traceability before advancing.
