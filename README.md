# Feedbacker

React component-level feedback collection with automatic screenshots. Users can click on any React component in your app to provide targeted feedback. The library automatically captures component hierarchy, screenshots, and browser context, making bug reports and feature requests actionable.

[![npm version](https://img.shields.io/npm/v/feedbacker-react.svg)](https://www.npmjs.com/package/feedbacker-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/bebsworthy/feedbacker/actions/workflows/ci-release.yml/badge.svg)](https://github.com/bebsworthy/feedbacker/actions/workflows/ci-release.yml)

[**Live Demo**](https://bebsworthy.github.io/feedbacker/) | [**Documentation**](#installation) | [**NPM Package**](https://www.npmjs.com/package/feedbacker-react) | [**LLM.txt**](https://raw.githubusercontent.com/bebsworthy/feedbacker/main/llm.txt)

## Installation

```bash
npm install feedbacker-react

# Optional: Install a capture library (recommended: SnapDOM for 2x faster screenshots)
npm install @zumer/snapdom
# OR
npm install html2canvas
```

## Quick Start

```jsx
import { FeedbackProvider } from 'feedbacker-react';

function App() {
  return (
    <FeedbackProvider>
      <YourApp />
    </FeedbackProvider>
  );
}
```

Users can now:
- Click the feedback button (bottom-right by default)
- Select any React component by hovering and clicking
- Submit feedback with automatic screenshots

### Coding Agent

For LLM-powered development assistants, you can automate the setup:

```markdown
Please read the setup instructions from https://raw.githubusercontent.com/bebsworthy/feedbacker/main/llm.txt 
and install feedbacker-react with @zumer/snapdom in my React application. Configure it with 
automatic screenshot capture and set up the feedback handler to log to console.
```

The LLM should:
1. Install `feedbacker-react` and `@zumer/snapdom`
2. Wrap your app with `FeedbackProvider`
3. Configure SnapDOM for optimized screenshots
4. Set up feedback handling

## Configuration

### Basic Options

```jsx
<FeedbackProvider
  // UI position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  position="bottom-right"
  
  // Theme color (any valid CSS color)
  primaryColor="#3b82f6"
  
  // Enable/disable the feedback system
  enabled={true}
  
  // LocalStorage key prefix
  storageKey="feedbacker"
  
  // Screenshot library: "snapdom" | "html2canvas"
  captureLibrary="snapdom"
  
  // Auto-copy feedback to clipboard
  autoCopy={false}
  
  // Auto-download: false | true | "markdown" | "zip"
  autoDownload={false}
  
  // Callback when feedback is submitted
  onFeedbackSubmit={(feedback) => {
    // Send to your backend
    fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback)
    });
  }}
>
  <YourApp />
</FeedbackProvider>
```

## Data Structure

### Feedback Object

```typescript
{
  id: string;                    // UUID
  componentName: string;          // React component name
  componentPath: string[];        // Component hierarchy (e.g., ["App", "Card", "Button"])
  comment: string;                // User's feedback text
  screenshot?: string;            // Base64 data URL of screenshot
  url: string;                    // Page URL when feedback was submitted
  timestamp: string;              // ISO 8601 timestamp
  browserInfo: {
    userAgent: string;
    viewportWidth: number;
    viewportHeight: number;
    platform?: string;
  };
  metadata?: Record<string, any>; // Optional custom metadata
}
```

## Programmatic API

### Using Hooks

```jsx
import { useFeedback, useFeedbackEvent } from 'feedbacker-react';

function MyComponent() {
  const { 
    feedbacks,      // Array of all feedback
    addFeedback,    // Manually add feedback
    clearFeedback,  // Clear all feedback
    exportFeedback  // Export feedback data
  } = useFeedback();
  
  const { emit, on } = useFeedbackEvent();
  
  // Programmatically start feedback selection
  const startFeedback = () => {
    emit('selection:start', {});
  };
  
  // Listen for feedback events
  useEffect(() => {
    const unsubscribe = on('feedback:submit', (feedback) => {
      console.log('New feedback:', feedback);
    });
    return unsubscribe;
  }, []);
  
  // Export feedback
  const handleExport = async () => {
    await exportFeedback({ 
      format: 'zip',        // 'markdown' | 'zip'
      includeImages: true,
      includeMetadata: true
    });
  };
}
```

## Screenshot Capture Libraries

### Option 1: SnapDOM (Recommended)
- 2x faster than html2canvas
- Better accuracy with modern CSS
- Smaller file size (~90KB)

```jsx
<FeedbackProvider captureLibrary="snapdom">
  <App />
</FeedbackProvider>
```

### Option 2: html2canvas (Default)
- Better browser compatibility
- Loaded from CDN if not installed
- Larger file size (~180KB)

```jsx
<FeedbackProvider captureLibrary="html2canvas">
  <App />
</FeedbackProvider>
```

### Custom Capture Adapter

```jsx
import { CaptureAdapter } from 'feedbacker-react';

class CustomAdapter {
  name = 'custom';
  
  async isSupported() {
    return true;
  }
  
  async capture(element, options) {
    // Your capture implementation
    const canvas = await yourLibrary.capture(element);
    return {
      success: true,
      dataUrl: canvas.toDataURL(),
      metadata: { width: canvas.width, height: canvas.height }
    };
  }
}

<FeedbackProvider captureAdapter={new CustomAdapter()}>
  <App />
</FeedbackProvider>
```

## Component Detection

Feedbacker uses multiple strategies to detect React components:

1. **React DevTools** - Most accurate in development
2. **React Fiber** - Direct access to React internals
3. **DOM Heuristics** - Fallback for production builds

Components are detected by:
- React DevTools integration (if available)
- `data-component` attributes
- React Fiber node inspection
- Class/function component names

## Storage

### LocalStorage
- Feedback automatically saved to localStorage
- 5MB limit with automatic cleanup of old entries
- Configurable storage key prefix

### Export Formats

```javascript
// Markdown export
await exportFeedback({ format: 'markdown' });
// Creates: feedback-report-[timestamp].md

// ZIP export with screenshots
await exportFeedback({ 
  format: 'zip',
  includeImages: true 
});
// Creates: feedback-[timestamp].zip
```

## Events

### Available Events

```javascript
// Component selection
emit('selection:start', {});     // Start selection mode
emit('selection:cancel', {});    // Cancel selection

// Modal control
emit('modal:open', { componentInfo });
emit('modal:close', {});

// Feedback
on('feedback:submit', (feedback) => {});
on('feedback:draft', (draft) => {});
```

## Browser Support

- Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- React 18+ required
- ES6 modules support required

### Mobile Support
- Touch and drag to select components
- Haptic feedback on supported devices
- Responsive UI adapts to screen size

## Performance

- **Zero impact when inactive** - Event listeners only active during feedback
- **Lazy loading** - Screenshot libraries loaded on-demand
- **Debounced interactions** - Mouse/touch events throttled
- **RequestIdleCallback** - Component detection runs during idle time

## TypeScript

Full TypeScript support with exported types:

```typescript
import { 
  Feedback, 
  ComponentInfo, 
  CaptureAdapter,
  FeedbackProviderProps 
} from 'feedbacker-react';
```

## Security Considerations

- No external API calls (except CDN fallback for capture libraries)
- All data stored locally until explicitly exported
- Screenshots respect CORS policies
- Sanitizes HTML content in feedback display
- No cookies or tracking

## Common Integration Patterns

### Next.js

```jsx
// app/layout.tsx
import { FeedbackProvider } from 'feedbacker-react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FeedbackProvider 
          enabled={process.env.NODE_ENV === 'development'}
          captureLibrary="snapdom"
        >
          {children}
        </FeedbackProvider>
      </body>
    </html>
  );
}
```

### Vite/Create React App

```jsx
// main.jsx or index.js
import { FeedbackProvider } from 'feedbacker-react';

ReactDOM.render(
  <FeedbackProvider>
    <App />
  </FeedbackProvider>,
  document.getElementById('root')
);
```

### With Authentication

```jsx
<FeedbackProvider
  onFeedbackSubmit={async (feedback) => {
    const token = await getAuthToken();
    await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...feedback,
        userId: currentUser.id
      })
    });
  }}
>
  <App />
</FeedbackProvider>
```

### Conditional Loading

```jsx
const FeedbackWrapper = ({ children }) => {
  const [showFeedback, setShowFeedback] = useState(false);
  
  useEffect(() => {
    // Only load for internal users
    setShowFeedback(user?.role === 'internal');
  }, [user]);
  
  if (!showFeedback) return children;
  
  return (
    <FeedbackProvider enabled={true}>
      {children}
    </FeedbackProvider>
  );
};
```

## Troubleshooting

### Screenshot not capturing
- Check CORS settings for external images
- Ensure capture library is installed or CDN is accessible
- Try switching between snapdom and html2canvas

### Component not detected
- Add `displayName` to components in production
- Use named function components instead of arrows
- Add `data-component="ComponentName"` attribute as fallback

### Storage quota exceeded
- Feedback auto-cleanup removes entries older than 30 days
- Export and clear feedback manually: `clearFeedback()`
- Reduce screenshot quality in capture options

## License

MIT

## Links

- [GitHub](https://github.com/feedbacker/core)
- [NPM](https://www.npmjs.com/package/feedbacker-react)
- [Demo](https://feedbacker.dev)