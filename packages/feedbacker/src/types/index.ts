/**
 * TypeScript type definitions for Feedbacker
 * Core interfaces and types for the feedback system
 */

export interface Feedback {
  id: string;
  componentName: string;
  componentPath: string[];
  comment: string;
  screenshot?: string | undefined;  
  url: string;
  timestamp: string;
  browserInfo: BrowserInfo;
  htmlSnippet?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface Draft {
  componentInfo: ComponentInfo;
  comment: string;
  screenshot?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentInfo {
  name: string;
  path: string[];  
  element: HTMLElement;
  htmlSnippet?: string | undefined;
  props?: Record<string, any> | undefined;
  fiber?: any | undefined; // ReactFiber type - will be properly typed when React internals are available
}

export interface BrowserInfo {
  userAgent: string;
  viewport: { width: number; height: number };
  screen?: { width: number; height: number };
  platform?: string;
}

export interface FeedbackProviderProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  primaryColor?: string;
  enabled?: boolean;
  storageKey?: string;
  onFeedbackSubmit?: (feedback: Feedback) => void;
  children?: any; // React.ReactNode will be properly typed when React is imported
}

export interface ExportOptions {
  format: 'markdown' | 'zip';
  includeImages: boolean;
  includeMetadata: boolean;
}

// Storage-related interfaces
export interface FeedbackStore {
  version: string;
  feedbacks: Feedback[];
  draft?: Draft | undefined;
  settings?: UserSettings | undefined;
  lastCleanup?: string | undefined;
}

export interface UserSettings {
  position?: string;
  primaryColor?: string;
  lastExport?: string;
}

export interface StorageInfo {
  used: number;
  limit: number;
  available: number;
  percentage: number;
}

// Storage manager interface
export interface StorageManager {
  save(feedback: Feedback): Promise<void>;
  saveDraft(draft: Draft): Promise<void>;
  getAll(): Promise<Feedback[]>;
  getDraft(): Promise<Draft | null>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
  getStorageInfo(): StorageInfo;
  cleanup(): Promise<void>;
}

// Validation interfaces
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Component detection interfaces
export interface DetectionStrategy {
  detect(element: HTMLElement): ComponentInfo | null;
  setNext?(strategy: DetectionStrategy): DetectionStrategy;
  handle?(element: HTMLElement): ComponentInfo | null;
}

// FAB interfaces
export interface FABState {
  expanded: boolean;
  hasDraft: boolean;
  position: { x: number; y: number };
}

export interface FABAction {
  id: string;
  label: string;
  icon: any; // ReactNode when React is imported
  onClick: () => void;
}

// Modal interfaces
export interface ModalState {
  isOpen: boolean;
  isMinimized: boolean;
  isDirty: boolean;
  component: ComponentInfo | null;
  screenshot: string | null;
  comment: string;
}

export interface ModalActions {
  minimize(): void;
  restore(): void;
  submit(): void;
  cancel(): void;
}

// Export manager interface
export interface ExportManager {
  exportAsMarkdown(feedbacks: Feedback[]): string;
  exportAsZip(feedbacks: Feedback[]): Promise<Blob>;
}

// Error handling
export enum ErrorType {
  STORAGE_FULL = 'STORAGE_FULL',
  STORAGE_CORRUPT = 'STORAGE_CORRUPT',
  SCREENSHOT_FAILED = 'SCREENSHOT_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  DETECTION_FAILED = 'DETECTION_FAILED'
}

export interface FeedbackError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  timestamp: string;
}

// Hook interfaces
export interface UseFeedbackResult {
  feedbacks: Feedback[];
  draft: Draft | null;
  addFeedback: (feedback: Feedback) => void;
  deleteFeedback: (id: string) => void;
  clearAll: () => void;
  exportFeedback: (options: ExportOptions) => Promise<void>;
}

export interface UseComponentDetectionResult {
  isActive: boolean;
  activate: () => void;
  deactivate: () => void;
  selectedComponent: ComponentInfo | null;
  hoveredComponent: ComponentInfo | null;
}

export interface UseFeedbackStorageResult {
  feedbacks: Feedback[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}