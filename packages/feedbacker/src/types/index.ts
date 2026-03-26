/**
 * TypeScript type definitions for Feedbacker React widget
 * Re-exports shared types from @feedbacker/core and adds React-specific types
 */

import type { ReactNode } from 'react';
import type { Feedback } from '@feedbacker/core';

// Re-export all shared types from core
export type {
  Feedback,
  Draft,
  BrowserInfo,
  ComponentInfo,
  FeedbackStore,
  UserSettings,
  StorageInfo,
  StorageManager,
  ExportOptions,
  ValidationResult,
  FABState,
  FABAction,
  ModalState,
  ModalActions,
  ExportManager,
  FeedbackError,
  UseFeedbackResult,
  UseComponentDetectionResult,
  UseFeedbackStorageResult
} from '@feedbacker/core';

export { ErrorType } from '@feedbacker/core';

// React-specific types
export interface FeedbackProviderProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  primaryColor?: string;
  enabled?: boolean;
  storageKey?: string;
  onFeedbackSubmit?: (feedback: Feedback) => void;
  autoCopy?: boolean;
  autoDownload?: boolean | 'markdown' | 'zip';
  captureLibrary?: 'html2canvas' | 'snapdom' | string;
  captureAdapter?: unknown; // CaptureAdapter type when imported
  children?: ReactNode;
}
