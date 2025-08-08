# Feature Research: Core Feedbacker Implementation

## Research Overview
Analysis of the POC implementation and patterns for building the core feedbacker React library.

## Existing POC Analysis

### Component Detection Implementation
The POC (`documentation/modules/feedbacker/poc.html`) implements a multi-strategy detection approach:

1. **React DevTools Hook** (lines 6-17): Primary detection via `window.__REACT_DEVTOOLS_GLOBAL_HOOK__`
2. **Fiber Key Inspection** (lines 19-28): Fallback checking `__reactFiber*` properties
3. **DOM Tree Traversal** (lines 30-44): Walking up to find React roots
4. **Heuristic Analysis** (lines 114-129): Pattern matching for component-like structures

**Key Finding**: The detection logic is complex but works. Should be extracted into a standalone module with clear fallback chain.

### Mobile Interaction Pattern
The POC implements sophisticated touch handling (lines 302-373):
- `touchstart` ’ `touchmove` ’ `touchend` chain
- Drag-to-target with visual feedback
- Haptic feedback integration
- Prevention of scroll during selection

**Key Finding**: Mobile interaction requires careful event handling with `passive: false` to prevent scrolling.

### State Management Approach
The POC uses React hooks for local state:
- `useState` for UI state (selected component, modal open/closed)
- No global state management
- No persistence implementation yet

**Key Finding**: Need to add localStorage integration and potentially useReducer for complex state.

## Technical Considerations

### Bundle Size Optimization
- **html2canvas dependency**: ~170KB minified - should be lazy loaded
- **SVG icons**: Inline to avoid icon library dependency
- **CSS**: Use CSS modules or scoped styles to prevent conflicts

### React 18 Compatibility
- POC uses React 16+ patterns
- Should leverage React 18 features:
  - `useId` for unique IDs
  - `useSyncExternalStore` for localStorage sync
  - Automatic batching for performance

### CSS Architecture
POC uses inline styles extensively. Need to:
1. Extract to CSS files with BEM or CSS modules
2. Use CSS variables for customization
3. Ensure styles don't leak to host application

### Component Isolation
The POC mixes all functionality in one file. Should separate into:
```
src/
  components/
    FAB/
    Modal/
    Sidebar/
    Overlay/
  hooks/
    useComponentDetection
    useFeedbackStorage
    useExport
  utils/
    detection/
    export/
    storage/
```

## Integration Requirements

### Zero-Config Setup
Need single import with optional configuration:
```typescript
import { FeedbackProvider } from '@feedbacker/react';

// Minimal
<FeedbackProvider />

// With options
<FeedbackProvider 
  position="bottom-left"
  primaryColor="#7c3aed"
/>
```

### localStorage Schema
Design consistent data structure:
```typescript
interface FeedbackStore {
  version: string;
  feedbacks: Feedback[];
  drafts: Draft[];
  settings: UserSettings;
}
```

### Export Implementation
Two export paths to implement:
1. **Text-only**: Generate markdown string
2. **Full export**: Use JSZip or similar for creating archives

## Risk Assessment

### Browser Compatibility
- **Risk**: Touch events not supported in all browsers
- **Mitigation**: Pointer events API as primary, touch as fallback

### Performance Impact
- **Risk**: Component detection could slow down large React apps
- **Mitigation**: Debounce scanning, use requestIdleCallback

### Security Concerns
- **Risk**: Screenshot capture might expose sensitive data
- **Mitigation**: Add warning when activating, respect CORS

### React Version Fragmentation
- **Risk**: Different React versions have different fiber structures
- **Mitigation**: Multiple detection strategies, graceful degradation

## Implementation Patterns to Follow

### Modular Architecture
Each feature should be independently testable:
- FAB component with no dependencies on other components
- Storage module that works standalone
- Export utilities as pure functions

### Event-Driven Communication
Use EventEmitter or custom hooks for component communication:
```typescript
useFeedbackEvent('component.selected', (data) => {
  // Handle selection
});
```

### Progressive Enhancement
Core functionality works everywhere, enhanced features are optional:
- Basic: Click to select, text comment
- Enhanced: Screenshot, component tree, console logs

## Build Configuration

### Rollup Setup
Need multiple build outputs:
- ESM for modern bundlers
- CJS for Node.js environments  
- UMD for script tag usage

### TypeScript Configuration
Strong typing for better DX:
```json
{
  "compilerOptions": {
    "strict": true,
    "declaration": true,
    "jsx": "react-jsx"
  }
}
```

## Next Steps Priority

1. **Set up build pipeline** - TypeScript + Rollup configuration
2. **Extract detection logic** - Create robust component scanner
3. **Build FAB component** - With expand animations
4. **Implement storage layer** - localStorage with migration support
5. **Create modal system** - Minimizable with draft protection
6. **Add export functionality** - Markdown and ZIP generation

Research complete. Proceed to requirements phase?