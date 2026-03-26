# Feedbacker

Visual feedback capture for developers and teams. Select any element on screen, add a comment, and get a report with screenshots, component context, and browser info.

Available as a **React widget** you embed in your app, or a **Chrome extension** that works on any website.

[![npm version](https://img.shields.io/npm/v/feedbacker-react.svg)](https://www.npmjs.com/package/feedbacker-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/bebsworthy/feedbacker/actions/workflows/ci-release.yml/badge.svg)](https://github.com/bebsworthy/feedbacker/actions/workflows/ci-release.yml)

[**Live Demo**](https://feedbacker.mnbv.dev/) | [**NPM**](https://www.npmjs.com/package/feedbacker-react) | [**Releases**](https://github.com/bebsworthy/feedbacker/releases) | [**LLM.txt**](https://raw.githubusercontent.com/bebsworthy/feedbacker/main/llm.txt)

---

## React Widget

Embed feedback capture directly in your React app. Detects components via React fiber tree, captures screenshots, and stores feedback locally.

### Install

```bash
npm install feedbacker-react

# Recommended: faster screenshots
npm install @zumer/snapdom
```

### Quick Start

```jsx
import { FeedbackProvider } from 'feedbacker-react';

function App() {
  return (
    <FeedbackProvider captureLibrary="snapdom">
      <YourApp />
    </FeedbackProvider>
  );
}
```

That's it. Users can now click the feedback button, select any component, and submit feedback with automatic screenshots.

### Configuration

```jsx
<FeedbackProvider
  position="bottom-right"        // "top-left" | "top-right" | "bottom-left" | "bottom-right"
  primaryColor="#3b82f6"         // Any CSS color
  captureLibrary="snapdom"       // "snapdom" | "html2canvas"
  enabled={true}                 // Enable/disable
  storageKey="feedbacker"        // localStorage key prefix
  autoCopy={false}               // Copy feedback to clipboard on submit
  autoDownload={false}           // false | true | "markdown" | "zip"
  onFeedbackSubmit={(feedback) => {
    fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback)
    });
  }}
>
  <YourApp />
</FeedbackProvider>
```

### Framework Integration

**Next.js App Router:**

```jsx
// app/layout.tsx
import { FeedbackProvider } from 'feedbacker-react';

export default function RootLayout({ children }) {
  return (
    <html><body>
      <FeedbackProvider captureLibrary="snapdom" enabled={process.env.NODE_ENV === 'development'}>
        {children}
      </FeedbackProvider>
    </body></html>
  );
}
```

**Vite / Create React App:**

```jsx
import { FeedbackProvider } from 'feedbacker-react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <FeedbackProvider captureLibrary="snapdom">
    <App />
  </FeedbackProvider>
);
```

### Programmatic API

```jsx
import { useFeedback, useFeedbackEvent } from 'feedbacker-react';

function MyComponent() {
  const { feedbacks, exportFeedback } = useFeedback();
  const { emit, on } = useFeedbackEvent();

  // Start feedback mode programmatically
  const startFeedback = () => emit('selection:start', {});

  // Export as ZIP with screenshots
  const handleExport = () => exportFeedback({ format: 'zip', includeImages: true });
}
```

### Screenshot Libraries

| Library | Speed | Size | Notes |
|---------|-------|------|-------|
| **SnapDOM** (recommended) | 2x faster | ~90KB | Better modern CSS support |
| **html2canvas** (default) | Baseline | ~180KB | Wider browser compatibility |
| **Custom adapter** | Varies | Varies | Implement `CaptureAdapter` interface |

---

## Chrome Extension

Capture feedback on **any website** without writing code. Works on React, Vue, Angular, plain HTML, or any web page.

### Install

Download `feedbacker-extension-v*.zip` from the [latest release](https://github.com/bebsworthy/feedbacker/releases), then:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the extracted folder

### Usage

1. Click the Feedbacker icon in the toolbar, or press **Alt+Shift+F**
2. Hover over elements to see detection overlay
3. Click an element to capture it with a screenshot
4. Type your feedback and press Enter to submit
5. Open the sidebar to view, edit, delete, or export feedback

### Features

- **Works on any website** — no code integration needed
- **Native screenshots** via Chrome's `captureVisibleTab` API
- **Cross-site storage** — feedback persists across all websites via `chrome.storage`
- **Site filter** — view feedback for current site or all sites
- **Shadow DOM isolation** — no style conflicts with host pages
- **Event isolation** — keyboard/mouse events don't leak to the page
- **Export** — download as Markdown or ZIP with images
- **Settings** — configurable FAB position and accent color via popup

### Keyboard Shortcut

**Alt+Shift+F** toggles the extension on the current page. Customize at `chrome://extensions/shortcuts`.

---

## Feedback Data Structure

Both the React widget and Chrome extension produce the same feedback format:

```typescript
{
  id: string;                    // Unique ID
  componentName: string;         // Detected component/element name
  componentPath: string[];       // Hierarchy (e.g., ["App", "Card", "Button"])
  comment: string;               // User's feedback text
  screenshot?: string;           // Base64 data URL
  url: string;                   // Page URL
  timestamp: string;             // ISO 8601
  browserInfo: {
    userAgent: string;
    viewport: { width: number; height: number };
    platform?: string;
  };
  htmlSnippet?: string;          // HTML of the selected element
  metadata?: Record<string, unknown>;
}
```

## Component Detection

Both products use `@feedbacker/detection` with a chain of strategies:

1. **React DevTools** — most accurate, uses `__REACT_DEVTOOLS_GLOBAL_HOOK__`
2. **React Fiber** — inspects `__reactFiber$` keys on DOM elements
3. **DOM Heuristics** — `data-component`, `data-testid`, CSS class names, semantic HTML, ARIA roles
4. **Fallback** — element tag name, ID, classes, text content

On React sites, strategies 1-2 provide rich component names and hierarchy. On non-React sites, strategies 3-4 provide element identification.

## Export Formats

- **Markdown** — text report with component info, browser metadata, HTML snippets
- **ZIP** — includes `feedback.md`, `feedback.json`, and `images/` folder with extracted screenshots

## Monorepo Structure

| Package | Description |
|---------|-------------|
| [`packages/feedbacker`](packages/feedbacker/) | React widget (`feedbacker-react` on npm) |
| [`packages/extension`](packages/extension/) | Chrome extension |
| [`packages/core`](packages/core/) | Shared types, utilities, exporters, event bus |
| [`packages/detection`](packages/detection/) | Component detection strategies |
| [`packages/demo`](packages/demo/) | Landing page and playground |

## Development

```bash
# Install
npm install

# Run demo site
npm run dev

# Build all packages
npm run build --workspace=@feedbacker/core
npm run build --workspace=@feedbacker/detection
npm run build --workspace=feedbacker-react

# Build extension
cd packages/extension && npm run build

# Pack extension for distribution
cd packages/extension && npm run pack

# Run tests
npm test                          # Unit tests (all packages)
npm run test:e2e                  # React widget e2e (Playwright)
cd packages/extension && npm run test:e2e:headed  # Extension e2e
```

## Troubleshooting

**Screenshot not capturing:** Check CORS settings for external images. Try switching between `snapdom` and `html2canvas`.

**Component not detected:** Add `displayName` to components in production builds, or use `data-component="Name"` as a fallback attribute.

**Extension not activating:** Reload at `chrome://extensions`. Check that `Alt+Shift+F` is assigned at `chrome://extensions/shortcuts`.

**Storage quota exceeded:** Export and clear feedback. The widget auto-cleans entries when localStorage exceeds 80% capacity.

## License

MIT
