/**
 * @feedbacker/detection
 * Framework-agnostic component detection for React apps
 */

export { DetectionStrategy, DetectionChain } from './DetectionStrategy';
export {
  DevToolsStrategy,
  FiberStrategy,
  HeuristicStrategy,
  FallbackStrategy
} from './strategies';
export type { ComponentInfo } from './types';

// Utilities
export {
  requestIdleCallback,
  cancelIdleCallback,
  debounce,
  throttle,
  performanceMonitor,
  PerformanceMonitor
} from './utils/performance';
export { logger, Logger, LogLevel } from './utils/logger';
export { getHumanReadableName } from './utils/human-readable-name';
export { buildElementLabel } from './utils/element-label';

import { DetectionChain as _DetectionChain } from './DetectionStrategy';
import {
  DevToolsStrategy as _DevToolsStrategy,
  FiberStrategy as _FiberStrategy,
  HeuristicStrategy as _HeuristicStrategy,
  FallbackStrategy as _FallbackStrategy
} from './strategies';

/**
 * Convenience factory to create a fully configured detection chain
 */
export function createDetector(): _DetectionChain {
  const chain = new _DetectionChain();
  chain.buildChain(
    new _DevToolsStrategy(),
    new _FiberStrategy(),
    new _HeuristicStrategy(),
    new _FallbackStrategy()
  );
  return chain;
}
