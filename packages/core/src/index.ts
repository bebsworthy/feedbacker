/**
 * @feedbacker/core
 * Shared types, utilities, and exporters for the Feedbacker ecosystem
 */

// Types
export type {
  Feedback,
  Draft,
  BrowserInfo,
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
  UseFeedbackStorageResult,
  ComponentInfo
} from './types';

export { ErrorType } from './types';

// Event system
export type { EventType, EventListener } from './event-types';
export { FeedbackEventEmitter } from './event-bus';

// Validation
export {
  validateFeedback,
  validateDraft,
  validateComponentInfo,
  validateBrowserInfo,
  validateStorageData,
  validateComment,
  validateScreenshot,
  validateFeedbackId,
  isValidFeedback,
  isValidDraft,
  isValidComment,
  isValidScreenshot
} from './validation';

// Sanitization
export {
  sanitizeFeedback,
  sanitizeDraft,
  sanitizeComponentInfo,
  sanitizeBrowserInfo,
  sanitizeString,
  sanitizeComment,
  sanitizeUrl,
  sanitizeTimestamp,
  sanitizeDataUrl,
  sanitizeNumber,
  sanitizeArray,
  sanitizeProps,
  sanitizeMetadata,
  stripHtmlTags,
  escapeHtml,
  sanitizeFilename
} from './sanitize';

// Date utilities
export { formatDistanceToNow, formatDate, formatDateForStorage } from './date-utils';

// HTML snippet
export { captureHtmlSnippet, formatHtmlSnippet } from './html-snippet';

// Logger
export { logger, Logger, LogLevel } from './logger';

// Migrations
export { migrateData, needsMigration, getMigrationInfo } from './migrations';
export type { MigrationResult } from './migrations';

// Exporters
export { MarkdownExporter } from './export/markdown-exporter';
export { ZipExporter } from './export/zip-exporter';
