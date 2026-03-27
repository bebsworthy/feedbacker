# Phase Spec: Strategic UX Features

status: not_started
phase_key: phase-3-strategic-ux-features
phase_number: 3
last_updated: 2026-03-27

## 1. Inputs and Traceability

| Input | Path | Notes |
| ----- | ---- | ----- |
| BRD | `phases/phase-3-strategic-ux-features/BRD.md` | 17 functional contracts (FC-001 through FC-017), 10 acceptance criteria, 7 E2E flows |
| Research | `phases/phase-3-strategic-ux-features/RESEARCH.md` | 7 technical findings (TR-01 through TR-07), 4 resolved open questions |
| Core types | `packages/core/src/types.ts` | `Feedback`, `Draft`, `FeedbackStore`, `ModalState` interfaces |
| Detection types | `packages/detection/src/types.ts` | `ComponentInfo` interface |
| Detection controller | `packages/extension/src/core/detection-controller.ts` | Mouse-only selection, Escape-only keydown |
| Overlay | `packages/extension/src/ui/overlay.ts` | `ComponentOverlayUI` -- tooltip renders `info.name` and `info.path` |
| Modal | `packages/extension/src/ui/modal.ts` | `FeedbackModal` -- no type chips, no technical details toggle |
| Sidebar | `packages/extension/src/ui/sidebar.ts` | `ManagerSidebar` -- no search, no sort, no navigate-to-element |
| App controller | `packages/extension/src/ui/app.ts` | `FeedbackApp` -- wires all components, constructs `Feedback` objects |
| Markdown exporter | `packages/core/src/export/markdown-exporter.ts` | No type prefix in output |
| ZIP exporter | `packages/core/src/export/zip-exporter.ts` | No type prefix in output |

## 2. Technical Plan

### 2.1 Architecture and Module Boundaries

Six deliverables span three packages. The following table maps each deliverable to the files it touches and any new files it introduces.

| Deliverable | Package | Modified Files | New Files |
| ----------- | ------- | -------------- | --------- |
| D-1: Human-readable names | `@feedbacker/detection` | `src/index.ts` (re-export) | `src/utils/human-readable-name.ts` |
| D-1: Human-readable names | `@feedbacker/extension` | `src/ui/overlay.ts`, `src/ui/modal.ts`, `src/ui/sidebar.ts`, `src/ui/minimized-state.ts`, `src/ui/app.ts` | -- |
| D-2: Search and sort | `@feedbacker/extension` | `src/ui/sidebar.ts` | -- |
| D-3: Scroll-wheel granularity | `@feedbacker/extension` | `src/core/detection-controller.ts`, `src/ui/overlay.ts`, `src/ui/app.ts` | `src/ui/breadcrumb-trail.ts` |
| D-4: Type categorization | `@feedbacker/core` | `src/types.ts`, `src/export/markdown-exporter.ts`, `src/export/zip-exporter.ts`, `src/validation.ts` | -- |
| D-4: Type categorization | `@feedbacker/extension` | `src/ui/modal.ts`, `src/ui/sidebar.ts`, `src/ui/app.ts` | -- |
| D-5: Navigate to element | `@feedbacker/core` | `src/types.ts` | -- |
| D-5: Navigate to element | `@feedbacker/extension` | `src/ui/sidebar.ts`, `src/ui/app.ts` | `src/utils/css-selector-generator.ts`, `src/utils/element-relocator.ts` |
| D-6: Keyboard selection | `@feedbacker/extension` | `src/core/detection-controller.ts`, `src/ui/app.ts` | -- |

**Key architectural decisions:**

1. **`getHumanReadableName()` in `@feedbacker/detection`** (OQ-002 resolved). The function is pure -- accepts `HTMLElement` and optional `componentName`, returns `string`. Both the extension and the React widget benefit. Exported from the detection package index.

2. **Navigate-to-element via dedicated locate icon** (OQ-001 resolved). A locate icon button in the card action row avoids conflict with inline-edit click targets. The icon is only rendered for cards whose `url` origin matches the current page origin.

3. **Breadcrumb trail is informational only** (OQ-003 resolved). No click interaction -- the overlay retains `pointer-events: none`. Breadcrumb is a separate DOM element appended to `document.body` (same pattern as overlay/banner).

4. **Keyboard selection: dual mode** (OQ-004 resolved). Tab/Shift+Tab cycles focusable elements. Arrow Up/Down traverses DOM hierarchy. Both update the overlay. Enter confirms selection.

### 2.2 Data Model and Migrations

#### `Feedback` interface extension (`packages/core/src/types.ts`)

```typescript
export type FeedbackType = 'bug' | 'suggestion' | 'question';
export type BugSeverity = 'critical' | 'major' | 'minor';

export interface Feedback {
  // ... existing fields unchanged ...
  type?: FeedbackType | undefined;
  severity?: BugSeverity | undefined;
  elementSelector?: string | undefined;
}
```

All three new fields are optional (`T | undefined`). This preserves backward compatibility with pre-phase-3 items -- no migration code is needed. Rendering and export logic must handle `undefined` gracefully (TR-06).

#### `Draft` interface extension (`packages/core/src/types.ts`)

```typescript
export interface Draft {
  // ... existing fields unchanged ...
  type?: FeedbackType | undefined;
  severity?: BugSeverity | undefined;
}
```

Draft stores the selected type/severity so they persist across minimize/restore.

#### `ModalState` interface extension (`packages/core/src/types.ts`)

```typescript
export interface ModalState {
  // ... existing fields unchanged ...
  type: FeedbackType;
  severity?: BugSeverity | undefined;
}
```

#### `ModalOptions` interface extension (`packages/extension/src/ui/modal.ts`)

```typescript
interface ModalOptions {
  // ... existing fields unchanged ...
  draftType?: FeedbackType;
  draftSeverity?: BugSeverity;
  onSubmit: (comment: string, type: FeedbackType, severity?: BugSeverity) => void;
  onDraftSave: (comment: string, type: FeedbackType, severity?: BugSeverity) => void;
}
```

The `onSubmit` and `onDraftSave` callbacks gain `type` and `severity` parameters. The `onMinimize` callback already carries `currentComment`; it will also carry current type and severity.

#### `SidebarOptions` interface extension (`packages/extension/src/ui/sidebar.ts`)

```typescript
interface SidebarOptions {
  // ... existing fields unchanged ...
  onLocateElement: (feedback: Feedback) => void;
  currentOrigin: string;
}
```

The `onLocateElement` callback is invoked when the locate icon is clicked. `currentOrigin` is passed from the app controller so the sidebar can determine which cards get a locate icon.

#### FeedbackStore version

`FeedbackStore.version` remains at its current value. No migration step is required because all new fields are optional. A version bump to `"3.0"` is applied for forward-compatibility signaling only -- the migration system treats unknown fields as passthrough.

### 2.3 API Contracts and Error Semantics

This phase has no network APIs. All contracts are internal function signatures.

#### `getHumanReadableName(element: HTMLElement, componentName?: string): string`

**Location:** `packages/detection/src/utils/human-readable-name.ts`

**Resolution chain (priority order):**
1. `element.getAttribute('aria-label')` -- if non-empty string, return trimmed
2. `element.getAttribute('aria-labelledby')` -- resolve via `document.getElementById()`, return `textContent` if found
3. `element.textContent` -- if element has direct text content (not deeply nested), trim and truncate to 40 characters with ellipsis
4. `element.getAttribute('role')` -- return capitalized role (e.g., "Navigation", "Banner")
5. `componentName` parameter -- if provided and not "Unknown", return as-is
6. Fallback: `element.tagName.toLowerCase()` + first class name if present (e.g., "div.hero-section")

**Edge cases:**
- Text content check uses `element.childNodes` to find direct text nodes and `element.children.length <= 2` heuristic to avoid extracting text from large containers
- Returns minimum 1 character, never empty string
- If the element has no text, no aria attributes, no role, no component name, and no classes, returns the bare tag name (e.g., "div")

#### `generateCssSelector(element: HTMLElement): string | null`

**Location:** `packages/extension/src/utils/css-selector-generator.ts`

**Strategy (priority order):**
1. `#id` -- if element has a non-empty `id` attribute that does not look auto-generated (no UUID patterns, no hashes > 8 chars)
2. `[data-testid="value"]` -- if present
3. `[data-cy="value"]` or `[data-test="value"]` -- if present
4. Custom `[data-*]` attributes with stable-looking values
5. `tag.className:nth-child(n)` chain from the nearest ancestor with an ID or unique data attribute
6. Full path from `body` using `tag:nth-child(n)` segments (most fragile, last resort)

**Returns:** CSS selector string, or `null` if generation fails (e.g., element is detached from DOM). The returned selector is validated with `document.querySelector(selector)` before being stored -- if it does not match the original element, `null` is returned.

**Constraint:** Must not generate selectors referencing `#feedbacker-extension-root`, `#feedbacker-overlay`, or any element inside the extension's shadow DOM.

#### `relocateElement(selector: string): HTMLElement | null`

**Location:** `packages/extension/src/utils/element-relocator.ts`

Calls `document.querySelector(selector)`. Returns the element if found, `null` otherwise. No fuzzy matching in this phase (TR-07).

#### `highlightElement(element: HTMLElement, durationMs?: number): void`

**Location:** `packages/extension/src/utils/element-relocator.ts`

Scrolls the element into view (`element.scrollIntoView({ behavior: 'smooth', block: 'center' })`), then creates a temporary overlay highlight (blue border + background, identical to the selection overlay style) that auto-dismisses after `durationMs` (default 3000ms). Uses the same inline-style approach as `ComponentOverlayUI` to avoid Shadow DOM CSS scope issues.

#### Detection controller new methods

```typescript
// Added to DetectionController class
setCurrentElement(element: HTMLElement): void;
navigateToParent(): HTMLElement | null;
navigateToChild(): HTMLElement | null;
navigateToSibling(direction: 'next' | 'previous'): HTMLElement | null;
```

These methods manipulate a new private `_currentElement: HTMLElement | null` field. They call `this.detector.detectComponent(element)` on the new element and invoke `this.onHover()` with the result. They skip elements that are `script`, `style`, text nodes, or extension-injected elements (using the existing `isExtensionElement()` check).

#### Sidebar search and sort internals

Search and sort are internal to `ManagerSidebar`. No new public API beyond the existing `updateFeedbacks()` method.

- **Search:** A text input rendered between the filter tabs and the card list. Fires a debounced (300ms) handler that toggles `.fb-card-hidden` (`display: none`) on each card. Search checks `fb.comment`, `fb.componentName`, and `fb.url` (case-insensitive substring match).
- **Sort:** A toggle button in the search row. Default: newest-first (descending timestamp). Toggle switches to oldest-first (ascending). Sort reorders cards using `Node.insertBefore()` on the existing DOM nodes rather than rebuilding the list.
- **State:** `searchTerm: string` and `sortOrder: 'newest' | 'oldest'` are private fields on `ManagerSidebar`. They persist across filter tab switches within the same sidebar instance but reset when the sidebar is destroyed and recreated.

#### Error semantics

| Error scenario | Handling | User-facing message |
| -------------- | -------- | ------------------- |
| Name resolution fails entirely | Return tag name fallback | (none -- fallback is transparent) |
| CSS selector generation fails | Store feedback without `elementSelector` | (none -- locate icon not shown for that card) |
| Element relocation fails (selector no match) | Return `null`, show toast | "Element not found on this page" |
| Scroll-wheel `preventDefault` on passive listener | Register with `{ passive: false }` | (none -- technical fix) |
| No focusable elements during keyboard selection | Announce via ARIA live region | "No focusable elements found. Use arrow keys to navigate." |
| Screenshot capture fails during keyboard selection | Proceed without screenshot (existing behavior) | (none -- existing error handling) |

### 2.4 Auth/Authz Constraints

No authentication or authorization changes. The extension operates entirely client-side with `chrome.storage.local`. No new permissions are required in `manifest.json`.

### 2.5 Observability and Reliability

**Logging (via `@feedbacker/core` logger):**
- `logger.debug('Human-readable name resolved: {name} for <{tag}>')` -- on each name resolution
- `logger.debug('CSS selector generated: {selector}')` -- on successful selector generation
- `logger.warn('CSS selector generation failed for element')` -- on null return
- `logger.debug('Element relocated via selector: {selector}')` -- on successful relocation
- `logger.debug('Element relocation failed: {selector}')` -- on null return
- `logger.debug('Keyboard selection: Tab to {element}')` -- on Tab navigation
- `logger.debug('DOM navigation: {direction} to <{tag}>')` -- on scroll-wheel/arrow navigation

**No metrics or alerting** -- the extension has no telemetry infrastructure. All observability is via the debug logger visible in the browser console when `feedbacker-debug` is enabled.

**Reliability:**
- All new event listeners (`wheel`, `keydown` for Tab/arrows/Enter) are registered in `activate()` and removed in `deactivate()` to prevent leaks.
- The wheel listener uses `{ capture: true, passive: false }` to ensure `preventDefault()` works (TR-03).
- The breadcrumb trail DOM element is created in `activate()` and removed in `deactivate()`, matching the overlay lifecycle.
- The highlight overlay for navigate-to-element is created per invocation and auto-removed after timeout -- no persistent DOM element.

## 3. Test Plan

| T ID | Linked FC | Level | Target File | Scenario | Assertions | Status |
| ---- | --------- | ----- | ----------- | -------- | ---------- | ------ |
| T-001 | FC-001 | unit | `packages/detection/src/utils/__tests__/human-readable-name.test.ts` | Element with `aria-label="Submit Order"` | `getHumanReadableName(el)` returns `"Submit Order"` | not_started |
| T-002 | FC-001 | unit | `packages/detection/src/utils/__tests__/human-readable-name.test.ts` | Element with `aria-labelledby` pointing to a visible label element | Returns the referenced label's text content | not_started |
| T-003 | FC-001 | unit | `packages/detection/src/utils/__tests__/human-readable-name.test.ts` | Button with `textContent="Click me"` and no aria attributes | Returns `"Click me"` | not_started |
| T-004 | FC-001 | unit | `packages/detection/src/utils/__tests__/human-readable-name.test.ts` | Element with `role="navigation"` and no text | Returns `"Navigation"` | not_started |
| T-005 | FC-001 | unit | `packages/detection/src/utils/__tests__/human-readable-name.test.ts` | Element with no semantic info, `componentName="NavButton"` | Returns `"NavButton"` (component name fallback) | not_started |
| T-006 | FC-001 | unit | `packages/detection/src/utils/__tests__/human-readable-name.test.ts` | Bare `<div>` with no attributes, no text, no component name | Returns `"div"` | not_started |
| T-007 | FC-001 | unit | `packages/detection/src/utils/__tests__/human-readable-name.test.ts` | Element with long textContent (>40 chars) | Returns truncated text with ellipsis | not_started |
| T-008 | FC-001 | unit | `packages/detection/src/utils/__tests__/human-readable-name.test.ts` | Container `<div>` with many child elements (>2) and mixed text | Does not extract deeply nested text; falls back to role/component/tag | not_started |
| T-009 | FC-002 | integration | `packages/extension/src/__tests__/modal-technical-details.test.ts` | Modal opened with ComponentInfo including name and path on a React page | Modal header shows human-readable name. Technical details toggle exists. Clicking toggle reveals component name, path, and HTML snippet. Details hidden by default. | not_started |
| T-010 | FC-002 | integration | `packages/extension/src/__tests__/modal-technical-details.test.ts` | Modal opened with ComponentInfo on a non-React page (no component name) | Technical details section shows tag name and HTML snippet only; no component path shown | not_started |
| T-011 | FC-003 | unit | `packages/extension/src/__tests__/sidebar-search.test.ts` | Sidebar with 5 items; search term matches 2 items by comment text | Only 2 cards visible; 3 cards have `.fb-card-hidden` class | not_started |
| T-012 | FC-003 | unit | `packages/extension/src/__tests__/sidebar-search.test.ts` | Search term matches item by URL substring | Matching card remains visible | not_started |
| T-013 | FC-003 | unit | `packages/extension/src/__tests__/sidebar-search.test.ts` | Search term matches item by element name (componentName) | Matching card remains visible | not_started |
| T-014 | FC-003 | unit | `packages/extension/src/__tests__/sidebar-search.test.ts` | Search term matches no items | "No matching feedback" message displayed with search term | not_started |
| T-015 | FC-003 | unit | `packages/extension/src/__tests__/sidebar-search.test.ts` | Search is active; user switches filter tab from "This site" to "All sites" | Search term persists; filter applies to new tab's items | not_started |
| T-016 | FC-004 | unit | `packages/extension/src/__tests__/sidebar-sort.test.ts` | Sidebar with 3 items of different timestamps; sort toggle activated | Card order reverses from newest-first to oldest-first | not_started |
| T-017 | FC-004 | unit | `packages/extension/src/__tests__/sidebar-sort.test.ts` | Sort order set to oldest-first; sidebar closed and reopened | Sort order resets to newest-first (default) on new sidebar instance | not_started |
| T-018 | FC-005 | unit | `packages/extension/src/__tests__/detection-controller-granularity.test.ts` | Selection mode active; `navigateToParent()` called on a nested element | Returns parent element; `onHover` called with parent's ComponentInfo | not_started |
| T-019 | FC-005 | unit | `packages/extension/src/__tests__/detection-controller-granularity.test.ts` | `navigateToParent()` called when current element is `<html>` | Returns `null`; overlay does not change | not_started |
| T-020 | FC-005 | unit | `packages/extension/src/__tests__/detection-controller-granularity.test.ts` | `navigateToParent()` called on extension-injected element | Skips to next non-extension ancestor | not_started |
| T-021 | FC-006 | unit | `packages/extension/src/__tests__/detection-controller-granularity.test.ts` | `navigateToChild()` called on element with children | Returns first child element; `onHover` called with child's ComponentInfo | not_started |
| T-022 | FC-006 | unit | `packages/extension/src/__tests__/detection-controller-granularity.test.ts` | `navigateToChild()` called on element with no child elements | Returns `null` | not_started |
| T-023 | FC-006 | unit | `packages/extension/src/__tests__/detection-controller-granularity.test.ts` | `navigateToChild()` called on element whose children are all `<script>` or `<style>` | Returns `null` (skips non-visual elements) | not_started |
| T-024 | FC-007 | integration | `packages/extension/src/__tests__/breadcrumb-trail.test.ts` | Selection mode active; element nested 4 levels deep | Breadcrumb shows 4 segments; last segment is visually distinguished (bold) | not_started |
| T-025 | FC-007 | integration | `packages/extension/src/__tests__/breadcrumb-trail.test.ts` | Element nested 8 levels deep | Breadcrumb shows 6 segments max; leftmost segments truncated with ellipsis | not_started |
| T-026 | FC-007 | integration | `packages/extension/src/__tests__/breadcrumb-trail.test.ts` | Navigate to parent via scroll-wheel | Breadcrumb updates; previously-last segment is no longer distinguished | not_started |
| T-027 | FC-008 | unit | `packages/extension/src/__tests__/modal-type-chips.test.ts` | Modal opens; observe default chip state | "Suggestion" chip is selected (filled). "Bug" and "Question" chips are outlined. | not_started |
| T-028 | FC-008 | unit | `packages/extension/src/__tests__/modal-type-chips.test.ts` | Click "Bug" chip | "Bug" chip becomes filled red. "Suggestion" chip becomes outlined. | not_started |
| T-029 | FC-008 | unit | `packages/extension/src/__tests__/modal-type-chips.test.ts` | Submit feedback with "Bug" selected | `onSubmit` called with `type: 'bug'` | not_started |
| T-030 | FC-008 | unit | `packages/extension/src/__tests__/modal-type-chips.test.ts` | Submit feedback without changing default | `onSubmit` called with `type: 'suggestion'` | not_started |
| T-031 | FC-009 | unit | `packages/extension/src/__tests__/modal-type-chips.test.ts` | "Bug" chip selected | Severity control appears with options: Critical, Major, Minor. No default selection. | not_started |
| T-032 | FC-009 | unit | `packages/extension/src/__tests__/modal-type-chips.test.ts` | Switch from "Bug" to "Suggestion" after selecting severity | Severity control hidden; severity value cleared | not_started |
| T-033 | FC-009 | unit | `packages/extension/src/__tests__/modal-type-chips.test.ts` | "Bug" chip selected; no severity chosen; submit | `onSubmit` called with `type: 'bug'`, `severity: undefined` | not_started |
| T-034 | FC-010 | unit | `packages/extension/src/__tests__/sidebar-type-badge.test.ts` | Feedback with `type: 'bug'` rendered in sidebar | Card shows red badge with text "Bug" | not_started |
| T-035 | FC-010 | unit | `packages/extension/src/__tests__/sidebar-type-badge.test.ts` | Feedback with `type: 'suggestion'` rendered in sidebar | Card shows blue badge with text "Suggestion" | not_started |
| T-036 | FC-010 | unit | `packages/extension/src/__tests__/sidebar-type-badge.test.ts` | Pre-existing feedback with no `type` field rendered | Card renders without any badge; no errors | not_started |
| T-037 | FC-011 | unit | `packages/core/src/export/__tests__/markdown-exporter-type.test.ts` | Feedback with `type: 'bug'` exported to Markdown | Export heading includes "[Bug]" prefix before component name | not_started |
| T-038 | FC-011 | unit | `packages/core/src/export/__tests__/markdown-exporter-type.test.ts` | Feedback with no `type` field exported to Markdown | Export format unchanged from current behavior | not_started |
| T-039 | FC-011 | unit | `packages/core/src/export/__tests__/zip-exporter-type.test.ts` | Feedback with `type: 'question'` exported in ZIP markdown | Export heading includes "[Question]" prefix | not_started |
| T-040 | FC-011 | unit | `packages/core/src/export/__tests__/zip-exporter-type.test.ts` | Feedback with `type: 'bug'` and `severity: 'critical'` exported | Export heading includes "[Bug - Critical]" prefix | not_started |
| T-041 | FC-012 | integration | `packages/extension/src/__tests__/navigate-to-element.test.ts` | Click locate icon on a card whose selector matches an element on the current page | `scrollIntoView` called on the element; highlight overlay appears; highlight auto-dismisses after 3s | not_started |
| T-042 | FC-012 | integration | `packages/extension/src/__tests__/navigate-to-element.test.ts` | Click locate icon on a card whose selector matches no element | Toast "Element not found on this page" shown | not_started |
| T-043 | FC-012 | integration | `packages/extension/src/__tests__/navigate-to-element.test.ts` | Card for feedback captured on a different origin | Locate icon not rendered on the card | not_started |
| T-044 | FC-012 | integration | `packages/extension/src/__tests__/navigate-to-element.test.ts` | Locate and highlight; sidebar remains open during highlight | Sidebar is not destroyed or closed by the locate action | not_started |
| T-045 | FC-013 | unit | `packages/extension/src/__tests__/css-selector-generator.test.ts` | Element with unique `id="main-submit"` | Returns `"#main-submit"` | not_started |
| T-046 | FC-013 | unit | `packages/extension/src/__tests__/css-selector-generator.test.ts` | Element with `data-testid="login-btn"` | Returns `'[data-testid="login-btn"]'` | not_started |
| T-047 | FC-013 | unit | `packages/extension/src/__tests__/css-selector-generator.test.ts` | Element with auto-generated ID (UUID-like) | Does not use the ID; falls back to data attributes or nth-child | not_started |
| T-048 | FC-013 | unit | `packages/extension/src/__tests__/css-selector-generator.test.ts` | Extension-injected element (`#feedbacker-overlay`) | Returns `null` | not_started |
| T-049 | FC-013 | unit | `packages/extension/src/__tests__/css-selector-generator.test.ts` | Generated selector validated with `querySelector` returns the original element | Assertion: `document.querySelector(result) === element` | not_started |
| T-050 | FC-014 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Selection mode active; Tab key pressed | Focus moves to next focusable element; `onHover` called with that element's ComponentInfo | not_started |
| T-051 | FC-014 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Selection mode active; Shift+Tab pressed | Focus moves to previous focusable element | not_started |
| T-052 | FC-014 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Selection mode active; Escape pressed | Selection mode deactivates; no modal opened | not_started |
| T-053 | FC-014 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Page has no focusable elements; Tab pressed | ARIA live region announces "No focusable elements found. Use arrow keys to navigate." | not_started |
| T-054 | FC-015 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Selection mode active; element focused; Arrow Up pressed | Highlight moves to parent element (same as scroll-wheel up) | not_started |
| T-055 | FC-015 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Arrow Down on element with children | Highlight moves to first child element | not_started |
| T-056 | FC-015 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Arrow Up on `<html>` element | Key press ignored; highlight unchanged | not_started |
| T-057 | FC-016 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Selection mode active; element highlighted; Enter pressed | Selection mode deactivates; `onSelect` called with element's ComponentInfo; modal opens | not_started |
| T-058 | FC-016 | integration | `packages/extension/src/__tests__/keyboard-selection.test.ts` | Enter pressed in selection mode does not trigger form submission on the page | `e.preventDefault()` and `e.stopPropagation()` called | not_started |
| T-059 | FC-017 | integration | `packages/extension/src/__tests__/modal-type-chips.test.ts` | Type chips rendered; Arrow Right pressed on first chip | Focus moves to second chip; focus indicator visible | not_started |
| T-060 | FC-017 | integration | `packages/extension/src/__tests__/modal-type-chips.test.ts` | Arrow Right on last chip (Question) | Focus wraps to first chip (Suggestion) | not_started |
| T-061 | FC-017 | integration | `packages/extension/src/__tests__/modal-type-chips.test.ts` | Space pressed on focused chip | Chip becomes selected | not_started |
| T-062 | FC-001, FC-002, FC-008, FC-010, FC-011, FC-012, FC-013 | unit | `packages/extension/src/__tests__/backward-compatibility.test.ts` | Pre-existing feedback (no `type`, no `severity`, no `elementSelector`) rendered in sidebar | Card renders without badge, without locate icon, without errors | not_started |
| T-063 | FC-001, FC-002, FC-008, FC-010, FC-011, FC-012, FC-013 | unit | `packages/extension/src/__tests__/backward-compatibility.test.ts` | Pre-existing feedback exported as Markdown | Export format identical to pre-phase-3 output (no type prefix) | not_started |
| T-064 | FC-001, FC-002 | e2e | `packages/extension/e2e/human-readable-names.e2e.ts` | E2E Flow 1: activate selection, hover button with text "Submit Order", observe tooltip, click, observe modal header, toggle technical details | Tooltip shows "Submit Order"; modal header shows "Submit Order"; toggle reveals component name, path, snippet | not_started |
| T-065 | FC-003, FC-004 | e2e | `packages/extension/e2e/search-sort.e2e.ts` | E2E Flow 2: sidebar with 5+ items, type "button" in search, observe filtered cards, clear search, toggle sort to oldest-first | Matching cards shown; "No matching" for non-match; sort reverses order | not_started |
| T-066 | FC-005, FC-006, FC-007 | e2e | `packages/extension/e2e/scroll-wheel-granularity.e2e.ts` | E2E Flow 3: activate selection, hover nested element, observe breadcrumb, scroll up to parent, scroll up again, scroll down, click to select | Breadcrumb updates at each step; overlay follows; page does not scroll; modal opens with correct element | not_started |
| T-067 | FC-008, FC-009, FC-010, FC-011 | e2e | `packages/extension/e2e/type-categorization.e2e.ts` | E2E Flow 4: observe chip bar default, click Bug, observe severity, select Major, submit, check sidebar badge, export Markdown | Chips, severity, badge, and export all correct | not_started |
| T-068 | FC-012, FC-013 | e2e | `packages/extension/e2e/navigate-to-element.e2e.ts` | E2E Flow 5: capture feedback on current page, open sidebar, click locate icon, observe scroll and highlight | Page scrolls; element highlighted 3s; sidebar stays open | not_started |
| T-069 | FC-014, FC-015, FC-016, FC-017 | e2e | `packages/extension/e2e/keyboard-selection.e2e.ts` | E2E Flow 6: keyboard-only flow -- Tab to FAB, activate, Tab through elements, Arrow Up to parent, Enter to confirm, Tab to chips, arrow to Bug, Enter, Tab to textarea, type, Tab to submit, Enter | Full flow completes via keyboard; feedback saved with type "Bug" | not_started |
| T-070 | FC-001, FC-002, FC-008, FC-010, FC-011, FC-012, FC-013 | e2e | `packages/extension/e2e/backward-compatibility.e2e.ts` | E2E Flow 7: pre-existing feedback without new fields renders and exports correctly | Cards without badge; no navigation; export unchanged | not_started |

## 4. Exit-Criteria Mapping

| Exit Criterion | Evidence | Linked Tests | Status |
| -------------- | -------- | ------------ | ------ |
| Human-readable names appear in tooltip, modal header, sidebar card title, and minimized state across React and non-React pages | AC-001 satisfied; T-001 through T-008 pass; T-064 passes | T-001..T-008, T-064 | not_started |
| Technical details toggle in modal reveals component name, path, and HTML snippet; hidden by default | AC-002 satisfied; T-009, T-010 pass | T-009, T-010, T-064 | not_started |
| Sidebar search filters by comment, element name, URL with 300ms debounce; "No matching" empty state shown | AC-003 satisfied; T-011 through T-015 pass; T-065 passes | T-011..T-015, T-065 | not_started |
| Sidebar sort toggles newest/oldest; default newest-first | AC-004 satisfied; T-016, T-017 pass; T-065 passes | T-016, T-017, T-065 | not_started |
| Scroll-wheel up/down navigates parent/child during selection; breadcrumb visible; page does not scroll | AC-005 satisfied; T-018 through T-026 pass; T-066 passes | T-018..T-026, T-066 | not_started |
| Type chips (Bug/Suggestion/Question) in modal; "Suggestion" default; Bug reveals severity; chips keyboard-navigable | AC-006 satisfied; T-027 through T-033, T-059 through T-061 pass; T-067 passes | T-027..T-033, T-059..T-061, T-067 | not_started |
| Sidebar cards show type badges; exports include type prefix; pre-existing items unaffected | AC-007 satisfied; T-034 through T-040 pass; T-067, T-070 pass | T-034..T-040, T-062, T-063, T-067, T-070 | not_started |
| Navigate from sidebar card to element via locate icon; scroll, highlight, auto-dismiss; toast on not-found; cross-origin disabled | AC-008 satisfied; T-041 through T-044 pass; T-068 passes | T-041..T-044, T-068 | not_started |
| CSS selector generated and stored during capture; validated before storage | AC-008 satisfied; T-045 through T-049 pass | T-045..T-049 | not_started |
| Full keyboard selection flow: Tab/Shift+Tab cycle focusable, Arrow Up/Down navigate hierarchy, Enter confirms, Escape exits | AC-009 satisfied; T-050 through T-058 pass; T-069 passes | T-050..T-058, T-069 | not_started |
| Backward compatibility: pre-phase-3 feedback renders without errors, exports unchanged | AC-010 satisfied; T-062, T-063, T-070 pass | T-062, T-063, T-070 | not_started |

## 5. ADR Log

| ADR ID | Context | Options | Decision | Rationale | Impacted Docs | Status |
| ------ | ------- | ------- | -------- | --------- | ------------- | ------ |
| ADR-P3-001 | Where to place `getHumanReadableName()` | (A) `@feedbacker/detection` as shared utility. (B) Extension-only code. | A -- detection package | Function is pure (HTMLElement in, string out), has no extension dependencies, benefits React widget automatically. Aligns with monorepo shared-package philosophy. | BRD OQ-002, RESEARCH OQ-002 | Accepted |
| ADR-P3-002 | Navigate-to-element trigger | (A) Click anywhere on card. (B) Dedicated locate icon. (C) Double-click. | B -- Dedicated locate icon | Click-anywhere conflicts with inline-edit (phase 2). Locate icon fits existing action row pattern (edit, copy, delete). Icon only shown for same-origin items. | BRD OQ-001, RESEARCH OQ-001 | Accepted |
| ADR-P3-003 | Breadcrumb interactivity | (A) Clickable segments. (B) Informational only. | B -- Informational only | Clickable breadcrumbs require `pointer-events` on the overlay, which would interfere with element selection (overlay is `pointer-events: none`). Defer clickable breadcrumbs. | BRD OQ-003, RESEARCH OQ-003 | Accepted |
| ADR-P3-004 | Keyboard selection mode | (A) Tab only. (B) Tab + Arrow keys dual mode. (C) Synthetic TreeWalker tab order. | B -- Dual mode | Tab cycles focusable elements (natural, accessible). Arrow keys provide DOM hierarchy traversal for non-focusable elements (parity with scroll-wheel). Covers both accessibility and power-user needs. | BRD OQ-004, RESEARCH OQ-004 | Accepted |
| ADR-P3-005 | CSS selector generation | (A) Use external library (`finder`, `css-selector-generator`). (B) Inline implementation. | B -- Inline implementation (~60 lines) | Avoids external dependency. Selector strategy is simple: prefer ID > data-testid > data-* > nth-child chain. Validate with `querySelector` before storage. | RESEARCH TR-02 | Accepted |
| ADR-P3-006 | Sidebar search implementation | (A) Re-render full card list on each filter change. (B) Toggle `display: none` on existing cards via CSS class. | B -- CSS class toggle | More performant for large lists. Avoids DOM reconstruction. Cards already exist; toggling `.fb-card-hidden` is O(n) with no layout thrash beyond `display` changes. Sort uses `insertBefore` for reordering. | RESEARCH TR-05 | Accepted |
| ADR-P3-007 | Scroll-wheel listener registration | Standard passive listener vs explicit `{ passive: false }` | `{ capture: true, passive: false }` during selection mode only | Chrome defaults document-level wheel listeners to `passive: true` since Chrome 56. Without explicit `{ passive: false }`, `preventDefault()` is silently ignored and the page scrolls. Listener is removed on deactivation to avoid performance impact. | RESEARCH TR-03 | Accepted |
| ADR-P3-008 | New data model fields migration strategy | (A) Add migration step to backfill defaults. (B) Optional fields, no migration. | B -- Optional fields, no migration | All new fields (`type`, `severity`, `elementSelector`) are `T \| undefined`. Rendering and export code handle `undefined` gracefully. `FeedbackStore.version` bumped for forward-compat signaling only. | RESEARCH TR-06 | Accepted |

---

Instructions: See SKILL.md Step 4 for authoring rules. E2E test flows from BRD must map to level:e2e entries. Run verify-traceability before advancing.
