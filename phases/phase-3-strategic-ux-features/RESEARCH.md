# Phase Research: Strategic UX Features

status: complete
phase_key: phase-3-strategic-ux-features
phase_number: 3
last_updated: 2026-03-27

## 1. Scope and References

| Source | Key Findings | Notes |
| ------ | ------------ | ----- |
| BRD.md | 6 features (F-05, F-11, F-17, F-34, F-35, F-19) spanning human-readable names, search/sort, scroll-wheel granularity, type chips, navigate-to-element, keyboard selection | 17 functional contracts, 10 acceptance criteria |
| .audit/ux/04-audit.md | J-002 (manage feedback) has no search/sort; J-005 (element ID) undermined by jargon; J-006 (categorize) entirely unserved; J-007 (verify in context) unserved | Severity ratings confirm strategic priority |
| .audit/ux/05-proposals.md | All 6 findings classified as "Strategic Investment" with Medium-to-High effort | Code skeletons provided for some proposals |
| .audit/ux/01-user-goals.md | Non-technical reviewers (designers, PMs, clients) are the primary persona; "vague descriptions" and "context loss" are top pain points | F-05 and F-35 directly address these |
| .audit/ux/03-patterns.md | BugHerd and Marker.io benchmarks show type categorization and element relocation as table-stakes for paid tools | Feedbacker has 0/3 on these dimensions |

## 1b. Architecture Reference

- Shared reference: `phases/research/architecture-reference.md`
- Phase-specific architectural notes:

**Overlay renders outside Shadow DOM.** `ComponentOverlayUI` appends to `document.body`, not the shadow root. The breadcrumb trail (F-17) and any keyboard focus indicators must also render outside shadow DOM to overlay page elements accurately. This means breadcrumb CSS cannot use the `--fb-*` token system and must use inline styles (same pattern as the existing overlay).

**DetectionController is mouse-only.** Currently listens for `mousemove`, `click`, and `keydown` (Escape only) on `document`. Adding keyboard selection (F-19) and scroll-wheel granularity (F-17) requires adding `wheel`, `keydown` (Tab, arrows, Enter), and potentially `focusin` listeners. All must use `{ capture: true }` to intercept before page handlers.

**Feedback type has no storage field.** The `Feedback` interface in `core/types.ts` has no `type`, `severity`, or `elementSelector` field. Adding optional fields is backward-compatible since `FeedbackStore.version` already exists for migration gating.

## 2. Findings Register

| ID | Type | Description | Impact | Evidence | Proposed Direction |
| --- | ---- | ----------- | ------ | -------- | ------------------ |
| TR-01 | Feasibility | Human-readable name resolution requires a priority chain: `aria-label` > `aria-labelledby` (resolved) > visible `textContent` (trimmed, max ~40 chars) > `role` attribute > component name > `tag.className`. | Medium -- touches overlay.ts tooltip (line 58-61), modal.ts header (line 52), sidebar card rendering, minimized-state.ts | Tested: `el.textContent` on buttons/links reliably returns visible text; `el.getAttribute('aria-label')` is standard DOM API; no library needed | Implement as a pure function `getHumanReadableName(element: HTMLElement, componentName?: string): string` in `@feedbacker/detection` so both extension and React widget benefit. ~30 lines of code. |
| TR-02 | Architecture | CSS selector generation for F-35 (navigate-to-element) needs a robust strategy. Naive `element.id` or `tagName:nth-child()` selectors break on dynamic pages. | High -- if selectors are fragile, F-35 becomes unreliable and erodes trust | Prior art: libraries like `finder` (npm, 1.2KB gzipped) generate optimal unique CSS selectors preferring IDs > `data-*` attributes > `nth-child` chains. `document.querySelector(selector)` is O(n) but fast for single lookups. | Use a lightweight selector generator (inline implementation, ~60 lines) that prefers: `#id` > `[data-testid]` > `[data-*]` > `tag.class:nth-child`. Store as `elementSelector?: string` on `Feedback`. Avoid external dependencies. |
| TR-03 | Risk | Scroll-wheel hijacking during selection mode (F-17) must call `e.preventDefault()` to block page scroll, but this only works if the listener is registered as `{ passive: false }`. Chrome defaults wheel listeners to passive on document-level targets. | High -- without explicit `{ passive: false }`, `preventDefault()` is silently ignored and the page scrolls | Chrome docs confirm: document/window-level wheel listeners default to `{ passive: true }` since Chrome 56 | Register wheel listener with `{ capture: true, passive: false }` during selection mode only. Remove on deactivate to avoid performance impact. |
| TR-04 | Feasibility | Keyboard selection (F-19) Tab cycling through page focusable elements conflicts with Shadow DOM event isolation. The `ShadowHost` stops propagation on keyboard events. | High -- Tab events originating in the page won't be blocked by shadow host, but the detection controller's `keydown` listener on `document` needs to intercept Tab/arrows before the page uses them | `ShadowHost` only stops propagation for events targeting elements *inside* the shadow root. Document-level capture listeners fire before shadow DOM isolation. | Detection controller's `keydown` handler with `{ capture: true }` will intercept Tab/Arrow/Enter during selection mode before page handlers. Call `e.preventDefault()` + `e.stopPropagation()` for intercepted keys only. |
| TR-05 | Architecture | Sidebar search needs debounced filtering on an in-memory array. The sidebar currently receives `feedbacks: Feedback[]` and renders all cards imperatively. Adding search requires either: (a) re-rendering the full card list on each filter change, or (b) toggling `display: none` on existing card elements. | Low -- purely UI concern | Sidebar already rebuilds its card list when `update()` is called. Option (b) is more performant for large lists since it avoids DOM reconstruction. | Use option (b): render all cards once, toggle `display: none` via a CSS class `.fb-card-hidden`. Search input fires a debounced (300ms) filter that adds/removes the class. Sort can reorder via `flexbox order` property or `insertBefore` DOM reordering. |
| TR-06 | Data | Adding `type`, `severity`, and `elementSelector` to `Feedback` interface requires a storage migration path. Existing items lack these fields. | Medium -- must not break rendering of pre-phase-3 items | `FeedbackStore` already has a `version` field. Current items have no type/severity/selector. All new fields must be `T | undefined`. | Define fields as optional: `type?: 'bug' \| 'suggestion' \| 'question'`, `severity?: 'critical' \| 'major' \| 'minor'`, `elementSelector?: string`. No migration needed -- code handles `undefined` gracefully. Bump store version for forward compatibility. |
| TR-07 | Risk | Navigate-to-element (F-35) requires `scrollIntoView` on an element found by stored selector. If the page is an SPA that has re-rendered, the element may exist but at a different position, or the selector may match a different element. | Medium -- false positives are worse than no-match | SPA frameworks typically preserve `data-testid` and `id` attributes across re-renders. Class-based selectors are least stable. | Accept best-effort matching. When the selector matches, scroll and highlight. When it doesn't, show toast. Do not attempt fuzzy matching in this phase -- it adds complexity with low confidence. |

## 3. Open Questions and Decisions

| Q ID | Question | Resolution Propositions | Recommended Option | Status |
| ---- | -------- | ----------------------- | ------------------ | ------ |
| OQ-001 | Should navigate-to-element be triggered by clicking the card or a dedicated locate icon? | (A) Click anywhere on card navigates. (B) Dedicated locate icon/button on card. (C) Double-click card navigates. | **B -- Dedicated icon.** Click-anywhere conflicts with existing inline-edit (click to expand) and future card interactions. A small "locate" icon in the card action row is consistent with existing copy/delete/edit icons. | Resolved |
| OQ-002 | Should `getHumanReadableName()` live in `@feedbacker/detection` or extension-only code? | (A) In `@feedbacker/detection` as shared utility. (B) In extension's overlay/modal code only. | **A -- Detection package.** The function is pure (takes HTMLElement, returns string), has no extension dependencies, and benefits the React widget automatically. Aligns with monorepo shared-package philosophy. | Resolved |
| OQ-003 | Should the breadcrumb trail (F-17) be clickable for direct ancestor navigation? | (A) Clickable -- click any segment to jump highlight to that ancestor. (B) Informational only -- display path, no interaction. | **B -- Informational only.** Clickable breadcrumbs require pointer-events on the overlay (currently `pointer-events: none`), which would interfere with element selection. Defer clickable breadcrumbs to a future enhancement. | Resolved |
| OQ-004 | How should the extension handle `Tab` in selection mode for pages with few/no focusable elements? | (A) Only Tab through focusable elements; if none, show a toast. (B) Tab through focusable elements + Arrow keys for full DOM traversal regardless. (C) Create a synthetic tab order using `TreeWalker`. | **B -- Dual mode.** Tab for focusable elements (natural, accessible), Arrow keys for DOM hierarchy (matches scroll-wheel parity). Users who need to select non-focusable elements use arrows to traverse from any focused ancestor. Toast only if the page has zero focusable elements. | Resolved |

---

*Research complete. All 6 features are technically feasible with the current architecture. The highest-risk items are scroll-wheel passive listener handling (TR-03) and CSS selector robustness (TR-02/TR-07). No external dependencies required.*
