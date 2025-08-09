/**
 * Capture Library Type Definitions
 * Provides interfaces for pluggable screenshot capture adapters
 */

/**
 * Options for screenshot capture
 */
export interface CaptureOptions {
  quality?: number;
  backgroundColor?: string;
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
  timeout?: number;
  [key: string]: unknown; // Allow adapter-specific options
}

/**
 * Result from screenshot capture attempt
 */
export interface CaptureResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  corsIssue?: boolean;
  metadata?: {
    width?: number;
    height?: number;
    captureTime?: number;
    library?: string;
  };
}

/**
 * Interface for screenshot capture adapters
 */
export interface CaptureAdapter {
  /**
   * Name of the capture library
   */
  name: string;

  /**
   * Version of the library (if available)
   */
  version?: string;

  /**
   * Check if the adapter is supported in the current environment
   */
  isSupported(): Promise<boolean>;

  /**
   * Capture a screenshot of the given element
   */
  capture(element: HTMLElement, options?: CaptureOptions): Promise<CaptureResult>;

  /**
   * Preload the library (optional)
   * Useful for loading external scripts before first use
   */
  preload?(): Promise<void>;

  /**
   * Clean up resources (optional)
   * Called when adapter is no longer needed
   */
  cleanup?(): void;

  /**
   * Get recommended options for this adapter (optional)
   */
  getRecommendedOptions?(): CaptureOptions;
}

/**
 * Built-in capture libraries
 */
export enum CaptureLibrary {
  HTML2CANVAS = 'html2canvas',
  SNAPDOM = 'snapdom',
  CUSTOM = 'custom'
}

/**
 * Factory function type for creating capture adapters
 */
export type CaptureAdapterFactory = () => CaptureAdapter;

/**
 * Registry entry for capture adapters
 */
export interface CaptureAdapterRegistryEntry {
  library: CaptureLibrary | string;
  factory: CaptureAdapterFactory;
  isDefault?: boolean;
}
