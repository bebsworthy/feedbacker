# Feedbacker Configuration Guide

## FeedbackProvider Props

The `FeedbackProvider` component accepts the following configuration options:

### position
- **Type:** `"top-left" | "top-right" | "bottom-left" | "bottom-right"`
- **Default:** `"bottom-right"`
- **Description:** Sets the position of the feedback button on the screen.

```jsx
<FeedbackProvider position="bottom-right">
```

### primaryColor
- **Type:** `string` (any valid CSS color)
- **Default:** `"#3b82f6"`
- **Description:** Sets the primary color theme for all feedback UI elements including buttons, highlights, and accents.

```jsx
<FeedbackProvider primaryColor="#6366f1">
```

### enabled
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enables or disables the entire feedback system. When set to `false`, no feedback UI will be rendered.

```jsx
<FeedbackProvider enabled={true}>
```

### storageKey
- **Type:** `string`
- **Default:** `"feedbacker"`
- **Description:** The localStorage key used to persist feedback data. Change this to avoid conflicts when using multiple instances.

```jsx
<FeedbackProvider storageKey="my-app-feedback">
```

### autoCopy
- **Type:** `boolean`
- **Default:** `false`
- **Description:** When enabled, automatically copies the markdown version of captured feedback to the clipboard.

```jsx
<FeedbackProvider autoCopy={true}>
```

### autoDownload
- **Type:** `false | true | "markdown" | "zip"`
- **Default:** `false`
- **Description:** Automatically downloads feedback when captured.
  - `false`: No automatic download
  - `true`: Downloads as markdown file
  - `"markdown"`: Downloads as `.md` file with text content
  - `"zip"`: Downloads as `.zip` file including screenshots

```jsx
<FeedbackProvider autoDownload="markdown">
```

### onFeedbackSubmit
- **Type:** `(feedback: Feedback) => void`
- **Default:** `undefined`
- **Description:** Callback function triggered when feedback is submitted. Receives the complete feedback object.

```jsx
<FeedbackProvider 
  onFeedbackSubmit={(feedback) => {
    // Send to your backend
    api.submitFeedback(feedback);
    
    // Log to analytics
    analytics.track('feedback_submitted', {
      component: feedback.componentInfo.name,
      url: feedback.browserInfo.url
    });
  }}
>
```

### captureLibrary
- **Type:** `"html2canvas" | "snapdom" | string`
- **Default:** `"html2canvas"`
- **Description:** Specifies which screenshot capture library to use. Built-in options are `"html2canvas"` (default) and `"snapdom"`. You can also specify a custom library name if you've registered a custom adapter.

```jsx
// Use SnapDOM instead of html2canvas
<FeedbackProvider captureLibrary="snapdom">

// Use a custom registered library
<FeedbackProvider captureLibrary="my-custom-library">
```

### captureAdapter
- **Type:** `CaptureAdapter`
- **Default:** `undefined`
- **Description:** Provide a custom capture adapter implementation. This allows you to use any screenshot library by implementing the `CaptureAdapter` interface.

```jsx
import { CaptureAdapter } from '@feedbacker/core';

class MyCustomAdapter implements CaptureAdapter {
  name = 'custom';
  
  async isSupported() {
    return true;
  }
  
  async capture(element, options) {
    // Your custom capture logic
    return {
      success: true,
      dataUrl: '...'
    };
  }
}

<FeedbackProvider captureAdapter={new MyCustomAdapter()}>
```

## Complete Example

```jsx
import { FeedbackProvider } from '@feedbacker/core';

function App() {
  return (
    <FeedbackProvider
      // UI Configuration
      position="bottom-right"
      primaryColor="#6366f1"
      
      // System Configuration
      enabled={true}
      storageKey="my-app-feedback"
      
      // Screenshot Configuration
      captureLibrary="snapdom"  // Use SnapDOM for better performance
      
      // Auto Actions
      autoCopy={true}
      autoDownload="markdown"
      
      // Event Handler
      onFeedbackSubmit={(feedback) => {
        console.log('Feedback received:', feedback);
        
        // Send to your backend
        fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedback)
        });
      }}
    >
      <YourApp />
    </FeedbackProvider>
  );
}
```

## Feedback Object Structure

The feedback object passed to `onFeedbackSubmit` contains:

```typescript
interface Feedback {
  id: string;                    // Unique identifier
  timestamp: string;              // ISO timestamp
  comment: string;                // User's feedback text
  screenshot?: string;            // Base64 encoded screenshot (optional)
  htmlSnippet?: string;          // HTML of the selected element
  componentInfo: {
    name: string;                // React component name
    path: string[];              // Component hierarchy
    props?: any;                 // Component props (if available)
  };
  browserInfo: {
    url: string;                 // Current page URL
    userAgent: string;           // Browser user agent
    viewport: {                  // Screen dimensions
      width: number;
      height: number;
    };
    screen?: {                   // Device screen info
      width: number;
      height: number;
    };
    platform?: string;           // Operating system
  };
}
```

## Settings Persistence

User preferences for `autoCopy` and `autoDownload` can be configured:
1. Via props (takes precedence)
2. Through the Settings UI in the Feedback Manager
3. Saved to localStorage for persistence across sessions

## Environment Considerations

- **React Version:** Requires React 16.8+ (hooks support)
- **Browser Support:** Modern browsers with localStorage support
- **Screenshot Feature:** Uses html2canvas (loaded from CDN on-demand)
- **Clipboard API:** Requires HTTPS in production for autoCopy feature