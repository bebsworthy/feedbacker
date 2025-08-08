# Screenshot Capture Libraries

Feedbacker supports multiple screenshot capture libraries through a pluggable adapter system. By default, it uses html2canvas, but you can easily switch to SnapDOM or implement your own adapter.

## Supported Libraries

### html2canvas (Default)
- **Installation**: Optional, loaded from CDN if not installed
- **Pros**: Mature, widely used, good compatibility
- **Cons**: Slower performance, larger bundle size

```bash
npm install html2canvas
```

### SnapDOM (Recommended)
- **Installation**: Optional, better performance when installed locally
- **Pros**: Faster performance, better accuracy, smaller output
- **Cons**: Newer library, less widespread adoption

```bash
npm install @zumer/snapdom
```

## Usage

### Basic Configuration

```jsx
import { FeedbackProvider } from 'feedbacker-react';

// Use html2canvas (default)
<FeedbackProvider>
  <App />
</FeedbackProvider>

// Use SnapDOM
<FeedbackProvider captureLibrary="snapdom">
  <App />
</FeedbackProvider>
```

### Custom Adapter

You can create your own capture adapter:

```jsx
import { CaptureAdapter } from 'feedbacker-react';

class MyCustomAdapter implements CaptureAdapter {
  name = 'custom';
  
  async isSupported() {
    // Check if your library is supported
    return true;
  }
  
  async capture(element, options) {
    // Implement screenshot capture
    const canvas = await myLibrary.capture(element);
    return {
      success: true,
      dataUrl: canvas.toDataURL()
    };
  }
  
  async preload() {
    // Optional: preload your library
  }
  
  cleanup() {
    // Optional: cleanup resources
  }
}

// Use custom adapter
const adapter = new MyCustomAdapter();
<FeedbackProvider captureAdapter={adapter}>
  <App />
</FeedbackProvider>
```

## Installation Methods

### 1. NPM Installation (Recommended)
Install the capture library as a dependency in your project:

```bash
# For SnapDOM
npm install @zumer/snapdom

# For html2canvas
npm install html2canvas
```

Benefits:
- Faster loading (no CDN requests)
- Version control
- Works offline
- Better tree-shaking

### 2. CDN Fallback (Automatic)
If the library is not installed via npm, Feedbacker will automatically load it from CDN:
- html2canvas: Loads from cdnjs.cloudflare.com
- SnapDOM: Loads from jsdelivr.net

This is convenient for quick prototypes but not recommended for production.

## Performance Comparison

| Library | Speed | Accuracy | Bundle Size | CORS Handling |
|---------|-------|----------|-------------|---------------|
| html2canvas | ★★☆ | ★★★ | ~180KB | Good |
| SnapDOM | ★★★ | ★★★ | ~90KB | Excellent |

## Troubleshooting

### Library Not Loading
If you see errors like "SnapDOM script present but library not available":
1. Install the library via npm: `npm install @zumer/snapdom`
2. Ensure your bundler includes the library
3. Check browser console for loading errors

### CORS Issues
Both libraries handle CORS differently:
- **html2canvas**: Set `useCORS: true` in options
- **SnapDOM**: Handles CORS automatically in most cases

### Custom Adapter Not Working
Ensure your adapter implements all required methods:
- `name`: Library identifier
- `isSupported()`: Returns Promise<boolean>
- `capture()`: Returns Promise<CaptureResult>

## Example: Dynamic Library Selection

```jsx
const [captureLibrary, setCaptureLibrary] = useState('snapdom');

return (
  <>
    <select onChange={(e) => setCaptureLibrary(e.target.value)}>
      <option value="snapdom">SnapDOM (Fast)</option>
      <option value="html2canvas">html2canvas (Compatible)</option>
    </select>
    
    <FeedbackProvider captureLibrary={captureLibrary}>
      <App />
    </FeedbackProvider>
  </>
);
```