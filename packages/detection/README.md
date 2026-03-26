# @feedbacker/detection

Framework-agnostic component detection for web pages. Uses a chain of strategies to identify UI components from DOM elements.

## Detection Strategies

Strategies are tried in order until one succeeds:

1. **DevToolsStrategy** — uses React DevTools hook for accurate component names
2. **FiberStrategy** — inspects React fiber tree directly via `__reactFiber$` keys
3. **HeuristicStrategy** — uses `data-component`, `data-testid`, CSS class patterns, semantic HTML, and ARIA roles
4. **FallbackStrategy** — returns element tag name, ID, and classes

## Usage

```typescript
import { createDetector } from '@feedbacker/detection';

const detector = createDetector();
const info = detector.detectComponent(element);
// { name: "Button", path: ["App", "Card", "Button"], element: HTMLElement }
```

## API

```typescript
interface ComponentInfo {
  name: string;
  path: string[];
  element: HTMLElement;
  htmlSnippet?: string;
  props?: Record<string, unknown>;
  fiber?: unknown;
}
```

Also exports: `DetectionChain`, `DevToolsStrategy`, `FiberStrategy`, `HeuristicStrategy`, `FallbackStrategy`, and performance utilities (`debounce`, `throttle`, `requestIdleCallback`).
