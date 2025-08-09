# 🎯 Feedbacker Core

A zero-configuration React feedback system that enables component-level feedback capture with automatic screenshot functionality.

[![Version](https://img.shields.io/npm/v/feedbacker-react.svg)](https://www.npmjs.com/package/feedbacker-react)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/feedbacker-react.svg)](https://bundlephobia.com/result?p=feedbacker-react)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Features

✨ **Zero Configuration** - Just wrap your app and start collecting feedback  
🎯 **Component-Level** - Users can select specific React components for feedback  
📱 **Mobile Optimized** - Touch and drag interactions with haptic feedback  
📸 **Screenshot Capture** - Pluggable capture libraries (html2canvas, SnapDOM)  
💾 **Local Persistence** - Feedback stored locally with export options  
🚀 **Performance First** - < 50KB bundle with lazy loading and optimizations  
🎨 **Customizable** - Theming and positioning options  
🔧 **TypeScript Ready** - Full TypeScript support with comprehensive types  

## Quick Start

### Installation

```bash
npm install feedbacker-react
```

### Basic Usage

```tsx
import React from 'react';
import { FeedbackProvider } from 'feedbacker-react';
// CSS is automatically injected - no manual import needed!

function App() {
  return (
    <FeedbackProvider>
      <YourApp />
    </FeedbackProvider>
  );
}
```

That's it! Users can now:
- Hover over components to highlight them (desktop)
- Touch and drag to select components (mobile)  
- Click/tap to provide feedback with screenshots
- Press Esc to exit feedback mode

## Configuration Options

```tsx
<FeedbackProvider
  position="bottom-right"        // FAB position
  primaryColor="#3b82f6"        // Theme color
  enabled={true}                // Enable/disable system
  storageKey="my-app-feedback"  // LocalStorage key
  onFeedbackSubmit={(feedback) => {
    console.log('New feedback:', feedback);
    // Send to your backend
  }}
>
  <YourApp />
</FeedbackProvider>
```

### Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` | FAB position |
| `primaryColor` | `string` | `'#3b82f6'` | Primary theme color |
| `enabled` | `boolean` | `true` | Enable/disable feedback system |
| `storageKey` | `string` | `'feedbacker'` | LocalStorage key prefix |
| `captureLibrary` | `'html2canvas' \| 'snapdom'` | `'html2canvas'` | Screenshot capture library |
| `onFeedbackSubmit` | `(feedback: Feedback) => void` | - | Callback when feedback is submitted |

## Advanced Usage

### Using Hooks

```tsx
import { useFeedback, useFeedbackStorage } from 'feedbacker-react';

function MyComponent() {
  const { feedbacks, addFeedback, exportFeedback } = useFeedback();
  const { isLoading, error } = useFeedbackStorage();

  const handleExport = async () => {
    await exportFeedback({ 
      format: 'zip', 
      includeImages: true 
    });
  };

  return (
    <div>
      <p>Total feedback: {feedbacks.length}</p>
      <button onClick={handleExport}>Export Feedback</button>
    </div>
  );
}
```

### Screenshot Capture Libraries

Feedbacker supports multiple screenshot libraries through a pluggable adapter system. Install your preferred library:

```bash
# Option 1: SnapDOM (Recommended - faster, more accurate)
npm install @zumer/snapdom

# Option 2: html2canvas (Default - better compatibility)
npm install html2canvas
```

Then configure in your provider:

```tsx
// Use SnapDOM for better performance
<FeedbackProvider captureLibrary="snapdom">
  <YourApp />
</FeedbackProvider>

// Or use html2canvas (default)
<FeedbackProvider captureLibrary="html2canvas">
  <YourApp />
</FeedbackProvider>
```

**Note**: Libraries are loaded as peer dependencies. If not installed via npm, they will automatically load from CDN as a fallback.

See [CAPTURE_LIBRARIES.md](./CAPTURE_LIBRARIES.md) for detailed documentation and custom adapter implementation.

### Event System

```tsx
import { useFeedbackEvent } from 'feedbacker-react';

function CustomComponent() {
  const { on, emit } = useFeedbackEvent();

  useEffect(() => {
    // Listen for feedback events
    const unsubscribe = on('feedback:submit', (feedback) => {
      console.log('Feedback submitted:', feedback);
    });

    return unsubscribe;
  }, [on]);

  const triggerFeedback = () => {
    emit('modal:open', { componentInfo });
  };

  return <button onClick={triggerFeedback}>Give Feedback</button>;
}
```

## Data Types

### Feedback Object

```typescript
interface Feedback {
  id: string;
  componentName: string;
  componentPath: string[];
  comment: string;
  screenshot?: string;
  url: string;
  timestamp: string;
  browserInfo: BrowserInfo;
  metadata?: Record<string, any>;
}
```

### Export Options

```typescript
interface ExportOptions {
  format: 'markdown' | 'zip';
  includeImages: boolean;
  includeMetadata: boolean;
}
```

## Component Detection

Feedbacker automatically detects React components using multiple strategies:

1. **React DevTools Integration** - Most accurate, works with development builds
2. **Fiber Tree Inspection** - Direct React internals access
3. **DOM Heuristics** - Fallback method using DOM analysis
4. **Unknown Component** - Final fallback for unidentifiable elements

## Performance Optimizations

- **RequestIdleCallback** - Component detection runs during browser idle time
- **Debounced Interactions** - Mouse/touch events are throttled
- **React.memo** - Components are memoized to prevent unnecessary re-renders
- **Lazy Loading** - html2canvas is loaded on-demand
- **Zero Impact When Inactive** - No performance overhead when not in use

## Mobile Support

### Touch Interactions
- **Touch and Drag** - Select components by dragging
- **Haptic Feedback** - Vibration feedback on compatible devices
- **Responsive UI** - Mobile-optimized interface

### Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

## Browser Support

- **Modern Browsers** - Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **ES6+ Features** - Uses modern JavaScript features
- **React 18+** - Requires React 18 or higher
- **Optional Features**:
  - Screenshot capture requires browser canvas support
  - Haptic feedback requires Vibration API

## Storage and Export

### Local Storage
- Feedback is automatically saved to localStorage
- 5MB storage limit with cleanup
- Data migration for version updates
- Corruption recovery with fallback

### Export Formats

#### Markdown Export
```typescript
await exportFeedback({ 
  format: 'markdown',
  includeImages: false,
  includeMetadata: true 
});
```

#### ZIP Export (with Images)
```typescript
await exportFeedback({ 
  format: 'zip',
  includeImages: true,
  includeMetadata: true 
});
```

## Styling and Theming

### CSS Variables
```css
:root {
  --fb-primary: #3b82f6;
  --fb-background: #ffffff;
  --fb-text: #1f2937;
  --fb-border: #e5e7eb;
  --fb-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### Custom Styles
```css
.feedbacker-fab {
  /* Custom FAB styles */
}

.feedbacker-modal {
  /* Custom modal styles */
}

.feedbacker-overlay {
  /* Custom overlay styles */
}
```

## Demo

Run the demo locally:

```bash
cd packages/feedbacker/demo
open index.html
```

The demo showcases:
- Various component types (buttons, cards, forms, tables)
- Mobile and desktop interactions
- Screenshot capture functionality
- Export capabilities
- Real-time feedback collection

## Bundle Analysis

| Format | Size (Gzipped) | Description |
|--------|----------------|-------------|
| ESM | ~15KB | Modern bundle for ES6+ environments |
| CJS | ~18KB | CommonJS for Node.js compatibility |
| UMD | ~25KB | Universal bundle with dependencies |

### Dependencies
- **Peer Dependencies**: React 18+, ReactDOM 18+
- **Optional Dependencies**: html2canvas (lazy loaded)
- **Zero Runtime Dependencies** in core bundle

## Troubleshooting

### Common Issues

**Screenshot not capturing:**
- Ensure user has granted permission
- Check for CORS issues with external images
- Verify html2canvas compatibility

**Component detection not working:**
- Enable React DevTools for best results
- Ensure components have displayName or are named functions
- Check browser console for detection errors

**Storage quota exceeded:**
- Feedback system automatically cleans up old data
- Use export functionality to backup data
- Consider implementing server-side storage

### Debug Mode

```tsx
<FeedbackProvider 
  onFeedbackSubmit={(feedback) => {
    console.log('[Debug] Feedback:', feedback);
  }}
>
  <App />
</FeedbackProvider>
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://feedbacker.dev/docs)
- 🐛 [Issues](https://github.com/feedbacker/core/issues)
- 💬 [Discussions](https://github.com/feedbacker/core/discussions)
- 📧 [Support Email](mailto:support@feedbacker.dev)

---

Made with ❤️ by the Feedbacker team