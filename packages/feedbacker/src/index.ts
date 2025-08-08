/**
 * Feedbacker Core Library
 * A drop-in React feedback system for component-level feedback capture
 */

// Import base styles - this ensures CSS gets processed by Rollup
import './styles/feedbacker.module.css';

// Main provider component
export { FeedbackProvider } from './components/FeedbackProvider';

// Modal components
export { FeedbackModal } from './components/FeedbackModal/FeedbackModal';
export { MinimizedState } from './components/FeedbackModal/MinimizedState';

// Manager sidebar components
export { ManagerSidebar } from './components/ManagerSidebar/ManagerSidebar';
export { FeedbackList } from './components/ManagerSidebar/FeedbackList';

// Overlay component
export { ComponentOverlay } from './components/ComponentOverlay';

// Context and hooks
export { useFeedbackContext } from './context/FeedbackContext';
export { useFeedback } from './hooks/useFeedback';
export { useFeedbackStorage } from './hooks/useFeedbackStorage';
export { useFeedbackEvent, useFeedbackEventHelpers } from './hooks/useFeedbackEvent';
export { useComponentDetection } from './hooks/useComponentDetection';

// Component detection system
export { DetectionChain } from './detection/DetectionStrategy';
export { 
  DevToolsStrategy, 
  FiberStrategy, 
  HeuristicStrategy, 
  FallbackStrategy 
} from './detection/strategies';

// Utility functions
export { 
  captureElementScreenshot,
  captureScreenshotWithFallback,
  isScreenshotSupported,
  getRecommendedOptions
} from './utils/screenshot';
export { 
  loadHtml2Canvas,
  lazyLoad,
  isLibraryLoaded,
  clearLoadCache
} from './utils/lazyLoad';
export { formatDistanceToNow, formatDate } from './utils/dateUtils';

// Export functionality
export { 
  MarkdownExporter, 
  ZipExporter, 
  ExportManager 
} from './export';

// Types and interfaces
export type {
  Feedback,
  Draft,
  ComponentInfo,
  FeedbackProviderProps,
  ExportOptions,
  ExportManager as ExportManagerInterface,
  UseComponentDetectionResult,
  UseFeedbackResult,
  UseFeedbackStorageResult
} from './types';

// CSS is automatically included in the build
// For manual import: import '@feedbacker/core/styles'

// Version info
export const version = '1.0.0';