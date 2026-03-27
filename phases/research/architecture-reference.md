# Architecture Reference

last_updated: 2026-03-27

## 1. Project Structure

Monorepo with 5 packages. Build order: core -> detection -> feedbacker -> extension -> demo.

| Package | Path | Purpose |
|---------|------|---------|
| `@feedbacker/core` | `packages/core` | Shared types (`Feedback`, `Draft`, `StorageManager`), exporters (Markdown, ZIP), event bus, validation, sanitization, date utils |
| `@feedbacker/detection` | `packages/detection` | Component detection via strategy pattern: FiberStrategy (React), DevToolsStrategy, HeuristicStrategy, FallbackStrategy |
| `feedbacker-react` | `packages/feedbacker` | React widget (npm published). Hooks-based: `useFeedback`, `useComponentDetection`, `useFeedbackStorage` |
| `@feedbacker/extension` | `packages/extension` | Chrome extension. Vanilla TS, imperative DOM, Shadow DOM isolation |
| `@feedbacker/demo` | `packages/demo` | Landing page and playground (Vite) |

## 2. Extension Architecture (Primary Target)

### Entry Points
- **Service worker** (`background/service-worker.ts`): Handles `capture-screenshot` and `inject-detection-bridge` messages
- **Content script** (`content/content-script.ts`): Bootstraps ShadowHost + FeedbackApp
- **Popup** (`popup/popup.ts`): Settings UI, "Start Capturing" button

### Shadow DOM Isolation
- `ShadowHost` creates a `<div id="feedbacker-extension-root">` with a closed shadow root (open in test mode)
- All UI renders inside `div.feedbacker-container` within the shadow root
- Event isolation: host element stops propagation on all keyboard, mouse, pointer, focus, touch, wheel, drag, and form events to prevent host page interference
- CSS uses `:host` scoping with CSS custom properties (`--fb-*`)
- Exception: `ComponentOverlayUI` renders outside shadow DOM on `document.body` (needs to visually cover page elements)

### UI Component Pattern
All UI is vanilla TS classes with imperative DOM construction. Each class:
- Takes a `container: HTMLElement` (the shadow DOM container) and an options object with callbacks
- Creates DOM elements in the constructor
- Exposes `destroy()` for cleanup
- Uses `FocusTrap` for modal/dialog focus management

### Key Classes
| Class | File | Responsibility |
|-------|------|----------------|
| `FeedbackApp` | `ui/app.ts` | Main controller, wires all UI components, manages lifecycle |
| `FAB` | `ui/fab.ts` | Floating action button + expand menu |
| `FeedbackModal` | `ui/modal.ts` | Feedback capture form (comment, screenshot preview) |
| `ManagerSidebar` | `ui/sidebar.ts` | Feedback list, filter tabs, card rendering, footer actions |
| `ExportDialog` | `ui/export-dialog.ts` | Export format picker (Markdown/ZIP) |
| `ConfirmDialog` | `ui/confirm-dialog.ts` | Generic confirmation dialog |
| `ComponentOverlayUI` | `ui/overlay.ts` | Hover highlight + tooltip (on document.body) |
| `MinimizedState` | `ui/minimized-state.ts` | Minimized modal bar |

### State Management
- `StateManager` wraps a `StorageManager` (chrome.storage.local adapter)
- Holds `feedbacks: Feedback[]` and `draft: Draft | null` in memory
- Event-driven via `FeedbackEventEmitter` (events: `feedback:submit`, `draft:save`, `draft:clear`, `selection:start`, `selection:cancel`)
- All mutations go through async storage operations then re-read state

### Detection Flow
- `DetectionController` manages selection mode: activate/deactivate with mousemove (throttled 16ms), click, keydown (Escape) listeners on `document`
- Uses `createDetector()` from `@feedbacker/detection` (strategy pattern)
- Sets `document.body.style.cursor = 'crosshair'` during selection
- Detection bridge injected into MAIN world for React fiber access

### Styling
- All CSS in a single template literal string (`EXTENSION_CSS`) injected into shadow DOM via `<style>` tag
- Dark mode via `@media (prefers-color-scheme: dark)` on `:host`
- Reduced motion via `@media (prefers-reduced-motion: reduce)` -- blanket `animation-duration: 0s !important` on all `*` descendants
- Existing animations: `fb-toast-in` (200ms slide+fade), `fb-badge-bump` (300ms scale), `fb-pulse` (1.5s infinite, coach mark)

### Toast System
- `FeedbackApp.showToast(message)` creates a `.fb-toast` div with check icon + text
- Auto-dismisses after 3500ms via `setTimeout`
- Removes any existing `.fb-toast` before creating a new one (single toast at a time)
- Fixed position: bottom 88px, right 24px

### Export System
- `MarkdownExporter` and `ZipExporter` in `@feedbacker/core`
- `FeedbackApp.doExport()` dynamically imports `@feedbacker/core` for tree-shaking
- Export dialog offers two options: Markdown and ZIP
- Sidebar footer has duplicate Markdown/ZIP buttons

## 3. Data Model

Core type: `Feedback` with fields: `id`, `componentName`, `componentPath` (string[]), `comment`, `screenshot?` (base64 data URL), `url`, `timestamp` (ISO string), `browserInfo`, `htmlSnippet?`, `metadata?`.

Storage: `chrome.storage.local` keyed as `FeedbackStore` with `version`, `feedbacks[]`, `draft?`, `settings?`.

## 4. Testing Infrastructure

- Jest for unit tests (`packages/extension/src/__tests__/`)
- Playwright for e2e (`packages/extension/e2e/`)
- Test files exist for: app, export-dialog, extension-css, fab, minimized-state, modal, popup, sidebar
