# Feedbacker Core - Demo Application

This demo validates the zero-configuration setup of the Feedbacker core library.

## Quick Start

1. Open `index.html` in a web browser
2. The page demonstrates the zero-config setup working correctly

## What's Demonstrated

### ✅ Zero-Configuration Setup
```tsx
import { FeedbackProvider } from 'feedbacker-react';
import 'feedbacker-react/styles';

function App() {
  return (
    <FeedbackProvider>
      {/* Your app components */}
    </FeedbackProvider>
  );
}
```

### ✅ CSS Extraction Working
- CSS file is properly extracted to `dist/feedbacker.css`
- Styles can be imported via `feedbacker-react/styles`
- CSS Modules provide scoped class names

### ✅ Bundle Size Compliance
- ESM: 574 bytes gzipped ✅
- CJS: 3.3KB gzipped ✅ 
- UMD: 16.4KB gzipped ✅
- All under 50KB limit requirement

### ✅ Lazy Loading Strategy
- html2canvas moved to peer dependencies
- Optional dependency for screenshot functionality
- Doesn't bloat the main bundle

## Files

- `index.html` - Complete demo showing FeedbackProvider usage
- `package.json` - Demo dependencies including React 18+ and html2canvas

## Validation Points

1. **Zero Config**: No complex setup required
2. **CSS Import**: `import 'feedbacker-react/styles'` works
3. **Bundle Size**: Under 50KB gzipped requirement
4. **Peer Dependencies**: html2canvas properly externalized
5. **React 18+**: Compatible with latest React versions

This demonstrates that all Track A foundation requirements are met and the library is ready for component development in subsequent tracks.