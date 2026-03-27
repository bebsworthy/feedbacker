# Phase Spec: Fix Critical UX Issues

status: not_started
phase_key: phase-1-fix-critical-ux-issues
phase_number: 1
last_updated: 2026-03-27

## 1. Inputs and Traceability

| Source | Artifact | Used For |
| ------ | -------- | -------- |
| BRD | phases/phase-1-fix-critical-ux-issues/BRD.md | FC-001 through FC-028 requirements, AC-001 through AC-017, E2E flows 1-6 |
| UX Audit | .audit/ux/04-audit.md | Findings F-01 through F-32 (subset of 17 addressed here) |
| UX Proposals | .audit/ux/05-proposals.md | Code skeletons and implementation guidance |
| Codebase | packages/extension/src/ui/*.ts, packages/extension/src/styles/extension-css.ts, packages/extension/popup/* | Current implementation baseline |

## 2. Technical Plan

### 2.1 Architecture and Module Boundaries

This phase makes surgical edits to existing files within `packages/extension`. No new packages, no new build targets, no dependency additions. All changes are confined to the Chrome extension package.

**Module change map:**

| Module | Files Modified | Changes |
| ------ | -------------- | ------- |
| Styles | `src/styles/extension-css.ts` | Add `:focus-visible` rules, `prefers-reduced-motion` media query, fix `--fb-text-muted` contrast, add toast/coach-mark/draft-indicator CSS, make `.fb-screenshot-copy` always visible |
| Modal | `src/ui/modal.ts` | Reverse Enter/Cmd+Enter behavior, add aria-label on textarea, add role="dialog"/aria-modal on modal, add "Element location:" label prefix, add Cmd/Ctrl+Enter hint text, add draft-saved indicator |
| FAB | `src/ui/fab.ts` | Remove "Clear all" action, rename "Show manager" to "View feedback", rename "Export" to "Share / Export", add aria-label/aria-expanded, add tooltip with shortcut, add coach-mark support |
| Sidebar | `src/ui/sidebar.ts` | Add "Clear all" button to footer, rename "Copy markdown" tooltip to "Copy to clipboard", add aria-label on icon-only buttons, add role="complementary"/aria-label on sidebar, add role="tablist"/role="tab"/aria-selected on filter tabs |
| App | `src/ui/app.ts` | Wire ARIA live region, wire submit success toast, wire first-use coach mark (onboardingShown flag via chrome.storage.local) |
| Export Dialog | `src/ui/export-dialog.ts` | Change ZIP description to "Full report with screenshots", add role="dialog"/aria-modal="true" |
| Minimized State | `src/ui/minimized-state.ts` | Increase discard button target to 24x24px minimum |
| Popup | `popup/popup.html`, `src/popup/popup.ts` | Add keyboard shortcut display (OS-aware), add privacy trust signal |
| Icons | `src/ui/icons.ts` | No changes needed (check icon already exists for toast) |

**New UI micro-components (defined inline, not separate files):**

1. **Toast** -- A floating status element rendered near the FAB. Created/destroyed by `FeedbackApp`. Markup: `<div class="fb-toast" role="status" aria-live="polite">`. Auto-removes after 3500ms.
2. **Coach Mark** -- A tooltip element rendered adjacent to the FAB on first use. Created/destroyed by `FeedbackApp`. Markup: `<div class="fb-coach-mark">`. Dismisses on click or 8s timeout. Persists `onboardingShown` to `chrome.storage.local`.
3. **Draft Saved Indicator** -- A `<span class="fb-draft-saved">` appended inside the modal body below the textarea. Shown on draft save, fades after ~2s.

### 2.2 Data Model and Migrations

No data model changes. One new key in `chrome.storage.local`:

| Key | Type | Default | Purpose |
| --- | ---- | ------- | ------- |
| `feedbacker-onboarding-shown` | `boolean` | `false` (absent) | Tracks whether the first-use coach mark has been displayed |

No migration needed. Absence of the key is treated as `false`.

### 2.3 API Contracts and Error Semantics

No new APIs. All changes are client-side UI within the extension's shadow DOM and popup.

**chrome.storage.local interactions:**

| Operation | Key | When | Error Handling |
| --------- | --- | ---- | -------------- |
| `get('feedbacker-onboarding-shown')` | `feedbacker-onboarding-shown` | On FAB render (in `FeedbackApp.render()`) | On error: treat as `false`, show coach mark. Coach mark still dismisses normally. |
| `set({ 'feedbacker-onboarding-shown': true })` | `feedbacker-onboarding-shown` | On coach mark dismiss (click or 8s timeout) | On error: silently ignore. Coach mark may reappear next session. No user-facing error. |

**Keyboard shortcut mapping:**

```typescript
const isMac = navigator.platform.toUpperCase().includes('MAC');
const modKey = isMac ? 'Cmd' : 'Ctrl';       // for submit hint
const shortcutKey = isMac ? 'Opt' : 'Alt';    // for activation shortcut
```

### 2.4 Auth/Authz Constraints

No auth changes. All operations are local. The privacy trust signal (FC-022) is purely informational text in the popup.

### 2.5 Observability and Reliability

No telemetry, logging, or metrics changes. The extension has no analytics pipeline. `logger.debug` calls may be added for coach mark and toast lifecycle during development but should be gated behind existing debug flag.

**Reliability considerations:**

- Shadow DOM focus: All `:focus-visible` styles MUST use `box-shadow` (not `outline`) because shadow DOM boundaries can suppress browser-native focus outlines. Verified by existing `fb-textarea:focus` pattern which already uses `box-shadow`.
- `prefers-reduced-motion`: Must be a single `@media` block that blankets all transitions/animations. Using `*, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }` within the shadow DOM `:host` scope.
- Toast z-index: Must be at or above FAB level (z-index: 10000) but below modal (10001).
- Coach mark z-index: Same as toast (10000), positioned adjacent to FAB.

---

## 2.6 Detailed Implementation Specifications

### D-1: Plain-Language Labels (FC-001, FC-002, FC-003, FC-004)

**fab.ts -- FAB menu actions array (line 95-100):**

Replace:
```typescript
{ icon: listIcon(18), label: `Show manager (${this.opts.feedbackCount})`, onClick: this.opts.onShowManager },
{ icon: arrowDownTrayIcon(18), label: 'Export', onClick: this.opts.onExport },
{ icon: trashIcon(18), label: 'Clear all', onClick: this.opts.onClearAll }
```
With:
```typescript
{ icon: listIcon(18), label: `View feedback (${this.opts.feedbackCount})`, onClick: this.opts.onShowManager },
{ icon: arrowDownTrayIcon(18), label: 'Share / Export', onClick: this.opts.onExport },
```

Remove the "Clear all" action entirely from the FAB menu. Remove `onClearAll` from `FABOptions` interface and remove its import of `trashIcon` if no longer needed.

**sidebar.ts -- Copy button tooltip (line 306):**

Replace `dataset.tooltip = 'Copy markdown'` with `dataset.tooltip = 'Copy to clipboard'`.

**export-dialog.ts -- ZIP description (line 60):**

Replace `'Complete export with images and JSON data'` with `'Full report with screenshots'`.

**modal.ts -- Component path label (line 77):**

Replace:
```typescript
pathEl.textContent = opts.componentInfo.path.join(' > ');
```
With:
```typescript
pathEl.textContent = 'Element location: ' + opts.componentInfo.path.join(' > ');
```

### D-2: Cmd/Ctrl+Enter Submit (FC-005, FC-006, FC-007)

**modal.ts -- Textarea keydown handler (line 100-109):**

Current behavior: Plain Enter submits (Shift+Enter for newline). This must be reversed.

Replace:
```typescript
this.textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    const comment = this.textarea.value.trim();
    if (comment) {
      e.preventDefault();
      opts.onSubmit(comment);
    }
  }
});
```
With:
```typescript
this.textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    const comment = this.textarea.value.trim();
    if (comment) {
      e.preventDefault();
      opts.onSubmit(comment);
    }
  }
});
```

**modal.ts -- Submit hint text in footer:**

After creating `submitBtn` and before appending to footer, insert an OS-aware hint:

```typescript
const isMac = navigator.platform.toUpperCase().includes('MAC');
const hint = document.createElement('span');
hint.className = 'fb-submit-hint';
hint.textContent = `${isMac ? 'Cmd' : 'Ctrl'}+Enter to submit`;
footer.appendChild(hint);
```

**extension-css.ts -- Add hint style:**

```css
.fb-submit-hint {
  font-size: 12px;
  color: var(--fb-text-muted);
  margin-right: auto;
  align-self: center;
}
```

Adjust footer layout: hint goes first (with `margin-right: auto`) pushing Cancel and Submit to the right.

### D-3: Clear All Relocated (FC-008)

**fab.ts:** Remove the "Clear all" action from the `actions` array in `expand()`. Remove `onClearAll` from `FABOptions`. Remove the `trashIcon` import if no other usage remains.

**sidebar.ts -- Add Clear All to footer:**

After the existing export buttons in the footer, add:

```typescript
const clearAllBtn = document.createElement('button');
clearAllBtn.className = 'fb-btn fb-btn-danger';
clearAllBtn.textContent = 'Clear all';
clearAllBtn.style.marginLeft = 'auto';
clearAllBtn.addEventListener('click', () => opts.onClearAll());
footer.appendChild(clearAllBtn);
```

Add `onClearAll: () => void` to `SidebarOptions`.

**app.ts:** Pass `onClearAll: () => this.confirmClearAll()` in the `ManagerSidebar` constructor options.

Hide "Clear all" when feedback count is 0: wrap the button creation in `if (opts.feedbacks.length > 0)` and update in `updateFeedbacks` / `renderFiltered`.

### D-4: Draft Save Indicator (FC-009)

**modal.ts:** After the textarea in the modal body, add a draft-saved indicator element:

```typescript
const draftIndicator = document.createElement('span');
draftIndicator.className = 'fb-draft-saved';
draftIndicator.textContent = 'Draft saved';
draftIndicator.style.display = 'none';
body.appendChild(draftIndicator);
```

In the existing `onDraftSave` callback (inside the `input` event setTimeout at line 94-98), after calling `opts.onDraftSave(this.textarea.value)`, show the indicator:

```typescript
draftIndicator.style.display = 'inline';
draftIndicator.style.opacity = '1';
setTimeout(() => {
  draftIndicator.style.opacity = '0';
  setTimeout(() => { draftIndicator.style.display = 'none'; }, 300);
}, 1500);
```

**extension-css.ts:**

```css
.fb-draft-saved {
  font-size: 12px;
  color: var(--fb-success);
  margin-top: 4px;
  transition: opacity 300ms ease;
}
```

### D-5: Keyboard Shortcut Visibility (FC-010, FC-011)

**popup/popup.html:** After the `<button id="activate-btn">` element, add:

```html
<div class="shortcut-hint" id="shortcut-hint"></div>
```

**popup/popup.ts:** In `init()`, after setting up the activate button:

```typescript
const shortcutHint = document.getElementById('shortcut-hint');
if (shortcutHint) {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  shortcutHint.textContent = `Keyboard shortcut: ${isMac ? 'Opt' : 'Alt'}+Shift+F`;
}
```

**fab.ts:** Add a `title` attribute on the FAB button:

```typescript
const isMac = navigator.platform.toUpperCase().includes('MAC');
this.button.title = `Feedbacker (${isMac ? 'Opt' : 'Alt'}+Shift+F)`;
```

### D-6: ARIA Label on Modal Textarea (FC-012)

**modal.ts (line 42-43 area):** After creating the textarea, add:

```typescript
this.textarea.setAttribute('aria-label', 'Feedback description');
```

### D-7: Focus-Visible Styles (FC-013)

**extension-css.ts:** Add a focus-visible rule block covering all interactive element classes:

```css
.fb-btn:focus-visible,
.fb-btn-icon:focus-visible,
.fb-fab:focus-visible,
.fb-fab-action:focus-visible,
.fb-export-option:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

This uses `box-shadow` instead of `outline` because shadow DOM can suppress native outlines. The `:focus-visible` pseudo-class ensures the ring only appears on keyboard navigation, not mouse clicks.

### D-8: ARIA Roles on Components (FC-014, FC-015, FC-016, FC-017, FC-028)

**modal.ts:** On the `modal` element (the `fb-modal` div):

```typescript
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-label', `Feedback for ${opts.componentInfo.name}`);
```

**sidebar.ts:** On the `this.sidebar` element:

```typescript
this.sidebar.setAttribute('role', 'complementary');
this.sidebar.setAttribute('aria-label', 'Feedback manager');
```

On the `filterBar` element:

```typescript
filterBar.setAttribute('role', 'tablist');
```

In `createFilterTab()`, on each button:

```typescript
btn.setAttribute('role', 'tab');
btn.setAttribute('aria-selected', mode === this.filterMode ? 'true' : 'false');
```

In `renderFiltered()`, update `aria-selected` when switching tabs:

```typescript
el.setAttribute('aria-selected', isActive ? 'true' : 'false');
```

**fab.ts:** On `this.button`:

```typescript
this.button.setAttribute('aria-label', 'Feedbacker menu');
this.button.setAttribute('aria-expanded', 'false');
```

In `expand()`:

```typescript
this.button.setAttribute('aria-expanded', 'true');
```

In `collapse()`:

```typescript
this.button.setAttribute('aria-expanded', 'false');
```

On `this.badge`:

```typescript
this.badge.setAttribute('aria-label', `${opts.feedbackCount} feedback items`);
```

Update badge aria-label in `updateCount()`:

```typescript
this.badge.setAttribute('aria-label', `${count} feedback items`);
```

**export-dialog.ts:** On the `modal` element:

```typescript
modal.setAttribute('role', 'dialog');
modal.setAttribute('aria-modal', 'true');
modal.setAttribute('aria-label', `Export ${opts.feedbackCount} items`);
```

**confirm-dialog.ts:** On the `dialog` element:

```typescript
dialog.setAttribute('role', 'dialog');
dialog.setAttribute('aria-modal', 'true');
dialog.setAttribute('aria-label', opts.title);
```

### D-9: ARIA Live Region (FC-018)

**app.ts:** Create a persistent live region element during `render()`:

```typescript
private liveRegion: HTMLDivElement | null = null;

// In render():
this.liveRegion = document.createElement('div');
this.liveRegion.setAttribute('role', 'status');
this.liveRegion.setAttribute('aria-live', 'polite');
this.liveRegion.style.cssText = 'position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;';
this.container.appendChild(this.liveRegion);
```

Add an `announce()` method:

```typescript
private announce(message: string): void {
  if (!this.liveRegion) return;
  this.liveRegion.textContent = '';
  requestAnimationFrame(() => {
    this.liveRegion!.textContent = message;
  });
}
```

Call `this.announce()` at these points:
- After `addFeedback` succeeds in `showModal.onSubmit`: `this.announce('Feedback saved');`
- After clipboard copy in sidebar `copyBtn` click: `this.announce('Copied to clipboard');`
- After `deleteFeedback` succeeds: `this.announce('Feedback deleted');`
- After `clearAll` succeeds: `this.announce('All feedback deleted');`

Since copy and delete callbacks originate in `ManagerSidebar`, add `onAnnounce?: (msg: string) => void` to `SidebarOptions` and call it from the sidebar's copy/delete handlers. Or, more cleanly, have `FeedbackApp` call `announce()` in its existing `onDelete` and copy wrapper callbacks.

### D-10: Muted Text Contrast Fix (FC-019, FC-020)

**extension-css.ts:**

Light mode -- change `--fb-text-muted` from `#9ca3af` to `#6b7280`:

```css
--fb-text-muted: #6b7280;
```

Contrast: `#6b7280` on `#ffffff` = 5.0:1 (passes AA for normal text).

Dark mode -- change `--fb-text-muted` from `#9ca3af` to `#d1d5db`:

```css
--fb-text-muted: #d1d5db;
```

Contrast: `#d1d5db` on `#1f2937` = 9.0:1 (passes AA).

### D-11: Prefers-Reduced-Motion (FC-021)

**extension-css.ts:** Add at the end, inside the template literal:

```css
@media (prefers-reduced-motion: reduce) {
  :host *,
  :host *::before,
  :host *::after {
    transition-duration: 0s !important;
    animation-duration: 0s !important;
    transition-delay: 0s !important;
    animation-delay: 0s !important;
  }
}
```

### D-12: Privacy Trust Signal (FC-022)

**popup/popup.html:** Inside the `.settings-section` div, after the last `.setting-row`, add:

```html
<div class="privacy-notice" id="privacy-notice">
  <span class="privacy-icon">&#128274;</span>
  Your feedback stays local &mdash; nothing leaves your browser.
</div>
```

**popup/popup.css** (or inline styles if no separate CSS file): Style with muted text, small font, centered.

### D-13: Aria-Label on Icon-Only Buttons (FC-023)

**sidebar.ts -- createCard():**

```typescript
editBtn.setAttribute('aria-label', 'Edit feedback');
copyBtn.setAttribute('aria-label', 'Copy to clipboard');
deleteBtn.setAttribute('aria-label', 'Delete feedback');
copyImgBtn.setAttribute('aria-label', 'Copy screenshot');
```

**sidebar.ts -- header close button:**

```typescript
closeBtn.setAttribute('aria-label', 'Close sidebar');
```

**modal.ts -- header buttons:**

```typescript
minBtn.setAttribute('aria-label', 'Minimize');
closeBtn.setAttribute('aria-label', 'Close');
```

**export-dialog.ts -- close button:**

```typescript
closeBtn.setAttribute('aria-label', 'Close export dialog');
```

### D-14: Minimized State Discard Button Target Size (FC-024)

**minimized-state.ts (line 61-65):** Change the discard button style:

Replace:
```typescript
discardBtn.style.cssText = `
  background: none; border: none; cursor: pointer;
  color: var(--fb-text-muted); font-size: 16px; padding: 0 2px;
  line-height: 1;
`;
```
With:
```typescript
discardBtn.style.cssText = `
  background: none; border: none; cursor: pointer;
  color: var(--fb-text-muted); font-size: 16px;
  min-width: 24px; min-height: 24px;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
`;
discardBtn.setAttribute('aria-label', 'Discard draft');
```

### D-15: Screenshot Copy Button Always Visible (FC-025)

**extension-css.ts:** Change `.fb-screenshot-copy` from `opacity: 0` with hover reveal to always visible:

Replace:
```css
.fb-screenshot-copy {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--fb-bg) !important;
  border: 1px solid var(--fb-border) !important;
  box-shadow: var(--fb-shadow);
  opacity: 0;
  transition: opacity 150ms;
}
.fb-card:hover .fb-screenshot-copy {
  opacity: 1;
}
```
With:
```css
.fb-screenshot-copy {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--fb-bg) !important;
  border: 1px solid var(--fb-border) !important;
  box-shadow: var(--fb-shadow);
  opacity: 0.85;
  transition: opacity 150ms;
}
.fb-screenshot-copy:hover {
  opacity: 1;
}
```

**sidebar.ts:** Add `aria-label` to the copy image button:

```typescript
copyImgBtn.setAttribute('aria-label', 'Copy screenshot');
```

### D-16: First-Use Coach Mark (FC-026)

**app.ts -- render():** After creating the FAB, check for onboarding flag:

```typescript
try {
  const result = await chrome.storage.local.get('feedbacker-onboarding-shown');
  if (!result['feedbacker-onboarding-shown']) {
    this.showCoachMark();
  }
} catch {
  this.showCoachMark(); // On error, show it anyway
}
```

Change `render()` to `async render()` or use `.then()`.

**app.ts -- showCoachMark():**

```typescript
private showCoachMark(): void {
  const mark = document.createElement('div');
  mark.className = 'fb-coach-mark';
  mark.textContent = 'Click to start giving feedback';
  this.container.appendChild(mark);

  // Pulse animation on FAB
  const fabEl = this.container.querySelector('.fb-fab') as HTMLElement;
  if (fabEl) fabEl.classList.add('fb-fab-pulse');

  const dismiss = () => {
    mark.remove();
    fabEl?.classList.remove('fb-fab-pulse');
    chrome.storage.local.set({ 'feedbacker-onboarding-shown': true }).catch(() => {});
  };

  mark.addEventListener('click', dismiss);
  fabEl?.addEventListener('click', dismiss, { once: true });
  setTimeout(dismiss, 8000);
}
```

**extension-css.ts:** Add coach mark and pulse styles:

```css
.fb-coach-mark {
  position: fixed;
  bottom: 88px;
  right: 24px;
  background: var(--fb-text);
  color: var(--fb-bg);
  padding: 8px 12px;
  border-radius: var(--fb-radius);
  font-size: 13px;
  font-family: var(--fb-font);
  box-shadow: var(--fb-shadow-lg);
  z-index: 10000;
  white-space: nowrap;
  pointer-events: auto;
}

@keyframes fb-pulse {
  0%, 100% { box-shadow: var(--fb-shadow-lg); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), var(--fb-shadow-lg); }
}
.fb-fab-pulse {
  animation: fb-pulse 1.5s ease-in-out infinite;
}
```

### D-17: Submit Success Toast (FC-027)

**app.ts:** After successful `addFeedback` in `showModal.onSubmit`, show a toast:

```typescript
this.showToast('Feedback saved!');
```

**app.ts -- showToast():**

```typescript
private showToast(message: string): void {
  // Remove any existing toast
  this.container.querySelector('.fb-toast')?.remove();

  const toast = document.createElement('div');
  toast.className = 'fb-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `${checkIcon(16, 'var(--fb-success)')} <span>${message}</span>`;
  this.container.appendChild(toast);

  // Badge count animation
  const badge = this.container.querySelector('.fb-fab-badge') as HTMLElement;
  if (badge) {
    badge.classList.add('fb-badge-bump');
    setTimeout(() => badge.classList.remove('fb-badge-bump'), 400);
  }

  setTimeout(() => toast.remove(), 3500);
}
```

Import `checkIcon` in app.ts.

**extension-css.ts:** Add toast and badge-bump styles:

```css
.fb-toast {
  position: fixed;
  bottom: 88px;
  right: 24px;
  background: var(--fb-bg);
  border: 1px solid var(--fb-border);
  border-radius: var(--fb-radius);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--fb-shadow-lg);
  z-index: 10000;
  font-family: var(--fb-font);
  font-size: 13px;
  color: var(--fb-text);
  animation: fb-toast-in 200ms ease-out;
}

@keyframes fb-toast-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fb-badge-bump {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}
.fb-badge-bump {
  animation: fb-badge-bump 300ms ease-in-out;
}
```

---

## 3. Test Plan

### Unit Tests

Unit tests use Vitest with jsdom. Target directory: `packages/extension/src/__tests__/`.

| T ID | Linked FC | Level | Target File | Scenario | Assertions | Status |
| ---- | --------- | ----- | ----------- | -------- | ---------- | ------ |
| T-001 | FC-001 | unit | `src/__tests__/fab.test.ts` | FAB expand() renders menu items | Menu contains "New feedback", "View feedback (N)", "Share / Export". Menu does NOT contain "Clear all" or "Show manager" or "Export" (standalone). | not_started |
| T-002 | FC-002 | unit | `src/__tests__/sidebar.test.ts` | Sidebar card copy button tooltip | Copy button `dataset.tooltip` equals "Copy to clipboard", NOT "Copy markdown" | not_started |
| T-003 | FC-003 | unit | `src/__tests__/export-dialog.test.ts` | Export dialog ZIP option description | ZIP option description text is "Full report with screenshots", does NOT contain "JSON data" | not_started |
| T-004 | FC-004 | unit | `src/__tests__/modal.test.ts` | Modal component path has label prefix | Path element textContent starts with "Element location:" | not_started |
| T-005 | FC-005 | unit | `src/__tests__/modal.test.ts` | Plain Enter in textarea does NOT submit | Dispatch KeyboardEvent('keydown', { key: 'Enter' }) on textarea; `onSubmit` NOT called; no `preventDefault` | not_started |
| T-006 | FC-006 | unit | `src/__tests__/modal.test.ts` | Cmd+Enter submits when textarea has content | Dispatch KeyboardEvent('keydown', { key: 'Enter', metaKey: true }) on textarea with content; `onSubmit` called with trimmed text | not_started |
| T-007 | FC-006 | unit | `src/__tests__/modal.test.ts` | Ctrl+Enter submits when textarea has content | Dispatch KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }) on textarea with content; `onSubmit` called | not_started |
| T-008 | FC-007 | unit | `src/__tests__/modal.test.ts` | Submit hint shows OS-appropriate modifier | When `navigator.platform` includes "Mac", hint text contains "Cmd+Enter"; otherwise "Ctrl+Enter" | not_started |
| T-009 | FC-008 | unit | `src/__tests__/sidebar.test.ts` | Clear all button exists in sidebar footer | Footer contains a button with text "Clear all" and class "fb-btn-danger". Clicking it calls `onClearAll`. | not_started |
| T-010 | FC-009 | unit | `src/__tests__/modal.test.ts` | Draft saved indicator appears after auto-save | Type in textarea, wait 2000ms+ for draft timer; indicator element with text "Draft saved" becomes visible; fades out after ~1.5s | not_started |
| T-011 | FC-010 | unit | `src/__tests__/popup.test.ts` | Popup shows OS-appropriate shortcut | Shortcut hint element contains "Alt+Shift+F" (non-Mac) or "Opt+Shift+F" (Mac) | not_started |
| T-012 | FC-011 | unit | `src/__tests__/fab.test.ts` | FAB button has tooltip with keyboard shortcut | `this.button.title` contains "Shift+F" | not_started |
| T-013 | FC-012 | unit | `src/__tests__/modal.test.ts` | Textarea has aria-label | `textarea.getAttribute('aria-label')` equals "Feedback description" | not_started |
| T-014 | FC-013 | unit | `src/__tests__/styles.test.ts` | Focus-visible styles exist for all interactive classes | CSS string contains `:focus-visible` rules for `.fb-btn`, `.fb-btn-icon`, `.fb-fab`, `.fb-fab-action`, `.fb-export-option` | not_started |
| T-015 | FC-014 | unit | `src/__tests__/modal.test.ts` | Modal has dialog role and aria-modal | Modal element has `role="dialog"`, `aria-modal="true"`, and `aria-label` containing component name | not_started |
| T-016 | FC-015 | unit | `src/__tests__/sidebar.test.ts` | Sidebar has complementary role | Sidebar element has `role="complementary"` and `aria-label` | not_started |
| T-017 | FC-016 | unit | `src/__tests__/fab.test.ts` | FAB has aria-label and aria-expanded toggles | Before expand: `aria-expanded="false"`. After expand: `aria-expanded="true"`. After collapse: `aria-expanded="false"`. | not_started |
| T-018 | FC-017 | unit | `src/__tests__/sidebar.test.ts` | Filter tabs have correct ARIA roles | Filter bar has `role="tablist"`. Each tab has `role="tab"`. Active tab has `aria-selected="true"`, inactive has `aria-selected="false"`. Switching tabs toggles `aria-selected`. | not_started |
| T-019 | FC-018 | unit | `src/__tests__/app.test.ts` | ARIA live region exists and announces | Live region element exists with `role="status"` and `aria-live="polite"`. After submit, its `textContent` is "Feedback saved". | not_started |
| T-020 | FC-019 | unit | `src/__tests__/styles.test.ts` | Light mode muted text contrast passes AA | `--fb-text-muted` in light mode is `#6b7280`. Verify contrast ratio >= 4.5:1 against `#ffffff`. | not_started |
| T-021 | FC-020 | unit | `src/__tests__/styles.test.ts` | Dark mode muted text contrast passes AA | `--fb-text-muted` in dark mode (prefers-color-scheme: dark) is `#d1d5db`. Verify contrast ratio >= 4.5:1 against `#1f2937`. | not_started |
| T-022 | FC-021 | unit | `src/__tests__/styles.test.ts` | Reduced motion media query exists | CSS string contains `@media (prefers-reduced-motion: reduce)` with `transition-duration: 0s` and `animation-duration: 0s` | not_started |
| T-023 | FC-022 | unit | `src/__tests__/popup.test.ts` | Privacy message in popup | Popup HTML or rendered DOM contains text "Your feedback stays local" | not_started |
| T-024 | FC-023 | unit | `src/__tests__/sidebar.test.ts` | All icon-only buttons have aria-label | editBtn, copyBtn, deleteBtn each have aria-label. screenshotCopyBtn has `aria-label="Copy screenshot"`. | not_started |
| T-025 | FC-024 | unit | `src/__tests__/minimized-state.test.ts` | Discard button meets minimum target size | Discard button has `min-width` and `min-height` of at least 24px | not_started |
| T-026 | FC-025 | unit | `src/__tests__/styles.test.ts` | Screenshot copy button is always visible | CSS for `.fb-screenshot-copy` does NOT have `opacity: 0` as default. Opacity is >= 0.85 by default. | not_started |
| T-027 | FC-026 | unit | `src/__tests__/app.test.ts` | Coach mark shows on first use, not on subsequent | When `chrome.storage.local.get` returns empty, coach mark element appears. After dismiss, `chrome.storage.local.set` called with `feedbacker-onboarding-shown: true`. When storage returns `true`, no coach mark element. | not_started |
| T-028 | FC-027 | unit | `src/__tests__/app.test.ts` | Toast appears on submit and auto-dismisses | After submit, `.fb-toast` element exists with `role="status"`, contains "Feedback saved!". After 3500ms, element is removed. | not_started |
| T-029 | FC-028 | unit | `src/__tests__/export-dialog.test.ts` | Export dialog has dialog role | Modal element has `role="dialog"` and `aria-modal="true"` | not_started |
| T-030 | FC-016 | unit | `src/__tests__/fab.test.ts` | Badge has descriptive aria-label | Badge element has `aria-label` containing "feedback items" | not_started |

### E2E Tests

E2E tests use Playwright with the Chrome extension fixture. Target directory: `packages/extension/e2e/tests/`.

| T ID | Linked FC | Level | Target File | Scenario | Assertions | Status |
| ---- | --------- | ----- | ----------- | -------- | ---------- | ------ |
| T-E01 | FC-001, FC-005, FC-006, FC-007, FC-009, FC-027 | e2e | `e2e/tests/capture-submit-flow.spec.ts` | **Flow 1: Capture and Submit Feedback.** Click FAB, verify menu labels. Start capture, select element, verify modal. Type with Enter (newline, not submit). Wait for draft indicator. Press Cmd/Ctrl+Enter to submit. Verify toast appears and auto-dismisses. | FAB menu shows "New feedback", "View feedback", "Share / Export" -- no "Clear all". Enter produces newline. Draft saved indicator appears. Cmd+Enter submits. Toast with "Feedback saved!" appears and disappears after ~3.5s. | not_started |
| T-E02 | FC-026 | e2e | `e2e/tests/onboarding-flow.spec.ts` | **Flow 2: First-Use Onboarding.** Fresh extension activation. Coach mark appears. Dismiss (click or wait). Reload -- no coach mark. | Coach mark visible with "Click to start giving feedback". After dismiss, `feedbacker-onboarding-shown` is `true` in storage. On re-activation, no coach mark. | not_started |
| T-E03 | FC-013, FC-014, FC-015, FC-016, FC-017, FC-018 | e2e | `e2e/tests/keyboard-a11y-flow.spec.ts` | **Flow 3: Keyboard Navigation.** Tab to FAB, verify focus ring. Enter to expand, verify aria-expanded. Tab through menu items. Open sidebar, verify role and ARIA. Tab through filter tabs, verify tab roles. Copy item, verify live region. | Focus ring visible (box-shadow present). `aria-expanded` toggles. Sidebar has `role="complementary"`. Tabs have `role="tab"`. Live region announces "Copied to clipboard". | not_started |
| T-E04 | FC-008 | e2e | `e2e/tests/clear-all-flow.spec.ts` | **Flow 4: Clear All Relocated.** Open sidebar, scroll to footer. Verify "Clear all" in footer with danger styling. Click "Clear all", confirm dialog appears. Confirm deletion. Verify empty state. | "Clear all" button in `.fb-sidebar-footer` with `.fb-btn-danger`. Confirm dialog has "Delete all" button. After confirm, sidebar shows empty state. | not_started |
| T-E05 | FC-010, FC-022 | e2e | `e2e/tests/popup-flow.spec.ts` | **Flow 5: Popup Discoverability and Privacy.** Open popup. Verify shortcut text. Verify privacy message. | Shortcut text contains "Shift+F". Privacy text contains "stays local". | not_started |
| T-E06 | FC-021, FC-019, FC-020 | e2e | `e2e/tests/visual-a11y-flow.spec.ts` | **Flow 6: Reduced Motion and Contrast.** Enable reduced-motion emulation. Interact with FAB -- no animation. Verify muted text color variables meet contrast. | With reduced-motion: computed `transition-duration` is "0s" on FAB. Card timestamp color passes contrast check. | not_started |

## 4. Exit-Criteria Mapping

| Exit Criterion | Evidence | Linked Tasks | Linked Tests | Status |
| -------------- | -------- | ------------ | ------------ | ------ |
| All jargon labels replaced with plain language | Grep for "Show manager", "Copy markdown", "JSON data" returns 0 matches in extension UI source | D-1 | T-001, T-002, T-003, T-004 | not_started |
| Cmd/Ctrl+Enter submits; Enter inserts newline | Unit tests pass for both key combos; E2E flow 1 passes | D-2 | T-005, T-006, T-007, T-008, T-E01 | not_started |
| Clear all relocated from FAB to sidebar footer | Grep fab.ts for "Clear all" returns 0 matches; sidebar footer has "Clear all" | D-3 | T-001, T-009, T-E04 | not_started |
| Draft saved indicator appears and fades | Manual and unit test verification | D-4 | T-010, T-E01 | not_started |
| Keyboard shortcut visible in popup and FAB tooltip | Unit test and E2E popup flow pass | D-5 | T-011, T-012, T-E05 | not_started |
| Textarea has aria-label | Unit test passes | D-6 | T-013 | not_started |
| :focus-visible styles on all interactive elements | CSS grep and E2E keyboard flow pass | D-7 | T-014, T-E03 | not_started |
| ARIA roles on all components | Unit tests for each component pass; E2E a11y flow passes | D-8 | T-015, T-016, T-017, T-018, T-029, T-030, T-E03 | not_started |
| ARIA live region announces actions | Unit and E2E tests verify announcements | D-9 | T-019, T-E03 | not_started |
| Muted text contrast >= 4.5:1 both modes | Unit test verifies color values | D-10 | T-020, T-021, T-E06 | not_started |
| Reduced motion disables all transitions | CSS grep and E2E verification | D-11 | T-022, T-E06 | not_started |
| Privacy message in popup | Unit and E2E popup flow | D-12 | T-023, T-E05 | not_started |
| All icon-only buttons have aria-label | Unit test checks all buttons | D-13 | T-024 | not_started |
| Discard button target >= 24x24px | Unit test checks min-width/min-height | D-14 | T-025 | not_started |
| Screenshot copy button always visible | CSS check: no opacity:0 default | D-15 | T-026 | not_started |
| First-use coach mark appears once | Unit test mocks storage; E2E verifies lifecycle | D-16 | T-027, T-E02 | not_started |
| Submit toast appears and auto-dismisses | Unit and E2E tests verify | D-17 | T-028, T-E01 | not_started |
| Export dialog has dialog role | Unit test | D-8 | T-029 | not_started |
| All unit tests pass (T-001 through T-030) | `npm run test` exits 0 | All | All unit tests | not_started |
| All E2E tests pass (T-E01 through T-E06) | `npm run test:e2e` exits 0 | All | All E2E tests | not_started |
| No regressions in existing E2E flow | `extension-flow.spec.ts` still passes | All | Existing E2E | not_started |

## 5. ADR Log

| ADR ID | Context | Options | Decision | Rationale | Impacted Docs | Status |
| ------ | ------- | ------- | -------- | --------- | ------------- | ------ |
| ADR-001 | Focus indicators inside shadow DOM | (A) Use CSS `outline` (B) Use `box-shadow` | B: box-shadow | Shadow DOM can suppress browser-native outlines. `box-shadow` is already the established pattern for `.fb-textarea:focus` in the codebase. Consistent and reliable across shadow boundaries. | extension-css.ts | Accepted |
| ADR-002 | Reduced motion implementation | (A) Target individual animations (B) Blanket disable via `*` selector | B: Blanket disable | 17 changes touch many transition properties. A single `@media` block with `*` selector and `!important` is comprehensive and future-proof. New animations added later are automatically covered. | extension-css.ts | Accepted |
| ADR-003 | Toast and coach mark as separate classes vs. inline in app.ts | (A) New files per component (B) Inline methods in FeedbackApp | B: Inline methods | These are trivial UI elements (5-10 lines DOM creation each). Creating separate class files adds unnecessary indirection for a small phase. If they grow, they can be extracted later. | app.ts | Accepted |
| ADR-004 | ARIA live region placement | (A) One per component (B) Single shared region in app.ts | B: Single shared region | A single visually-hidden live region in the container is the standard pattern. Multiple regions can cause duplicate announcements. The `announce()` method centralizes all status messages. | app.ts | Accepted |
| ADR-005 | Coach mark position awareness (Q-001) | (A) Hard-code bottom-right position (B) Position-aware relative to FAB | A: Hard-code bottom-right | The FAB defaults to bottom-right. Position-aware placement adds complexity (reading FAB position, flipping tooltip) beyond quick-win scope. Can be enhanced if users report issues with non-default positions. | app.ts, extension-css.ts | Accepted |
| ADR-006 | Hide "Clear all" when zero items (Q-002) | (A) Always show (B) Hide when zero items | B: Hide when zero items | Consistent with existing behavior where FAB export is a no-op with 0 items. Showing a destructive action with nothing to destroy is confusing. | sidebar.ts | Accepted |
| ADR-007 | Toast close button (Q-003) | (A) Auto-dismiss only (B) Add close button | A: Auto-dismiss only | 3.5s is short enough. Adding a close button increases complexity and visual noise for marginal benefit. Can be reconsidered if user feedback warrants it. | app.ts | Accepted |

---

Instructions: See SKILL.md Step 4 for authoring rules. E2E test flows from BRD must map to level:e2e entries. Run verify-traceability before advancing.
