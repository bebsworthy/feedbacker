/**
 * Capture Manager
 * Manages screenshot capture adapters and provides a unified interface
 */

import {
  CaptureAdapter,
  CaptureOptions,
  CaptureResult,
  CaptureLibrary,
  CaptureAdapterFactory
} from '../types/capture';
import { Html2CanvasAdapter } from './Html2CanvasAdapter';
import { SnapDOMAdapter } from './SnapDOMAdapter';
import logger from '../utils/logger';

export class CaptureManager {
  private static instance: CaptureManager | null = null;
  private adapters: Map<string, CaptureAdapter> = new Map();
  private factories: Map<string, CaptureAdapterFactory> = new Map();
  private currentAdapter: CaptureAdapter | null = null;
  private defaultLibrary: string = CaptureLibrary.HTML2CANVAS;

  private constructor() {
    // Register built-in adapters
    this.registerBuiltInAdapters();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CaptureManager {
    if (!CaptureManager.instance) {
      CaptureManager.instance = new CaptureManager();
    }
    return CaptureManager.instance;
  }

  /**
   * Register built-in adapters
   */
  private registerBuiltInAdapters(): void {
    // Register Html2Canvas adapter factory
    this.factories.set(CaptureLibrary.HTML2CANVAS, () => new Html2CanvasAdapter());

    // Register SnapDOM adapter factory
    this.factories.set(CaptureLibrary.SNAPDOM, () => new SnapDOMAdapter());
  }

  /**
   * Register a custom capture adapter
   */
  registerAdapter(name: string, factory: CaptureAdapterFactory, setAsDefault = false): void {
    this.factories.set(name, factory);

    if (setAsDefault) {
      this.defaultLibrary = name;
    }

    logger.info(`Registered adapter: ${name}`);
  }

  /**
   * Set the default capture library
   */
  setDefaultLibrary(library: string): void {
    if (!this.factories.has(library)) {
      throw new Error(`Capture library '${library}' is not registered`);
    }

    this.defaultLibrary = library;
    logger.info(`Default library set to: ${library}`);
  }

  /**
   * Get or create an adapter instance
   */
  private async getAdapter(library?: string): Promise<CaptureAdapter> {
    const targetLibrary = library || this.defaultLibrary;

    // Check if adapter already exists
    if (this.adapters.has(targetLibrary)) {
      return this.adapters.get(targetLibrary)!;
    }

    // Get factory and create adapter
    const factory = this.factories.get(targetLibrary);
    if (!factory) {
      throw new Error(`No factory registered for library: ${targetLibrary}`);
    }

    const adapter = factory();

    // Check if adapter is supported
    const isSupported = await adapter.isSupported();
    if (!isSupported) {
      throw new Error(`Capture library '${targetLibrary}' is not supported in this environment`);
    }

    // Preload if available
    if (adapter.preload) {
      try {
        await adapter.preload();
      } catch (error) {
        logger.warn(`Failed to preload ${targetLibrary}:`, error);
      }
    }

    // Cache the adapter
    this.adapters.set(targetLibrary, adapter);
    this.currentAdapter = adapter;

    return adapter;
  }

  /**
   * Capture a screenshot using the specified or default adapter
   */
  async capture(
    element: HTMLElement,
    options: CaptureOptions & { library?: string } = {}
  ): Promise<CaptureResult> {
    const { library, ...captureOptions } = options;

    try {
      // Get the appropriate adapter
      const adapter = await this.getAdapter(library);

      // Merge with recommended options if available
      let finalOptions = captureOptions;
      if (adapter.getRecommendedOptions) {
        const recommended = adapter.getRecommendedOptions();
        finalOptions = { ...recommended, ...captureOptions };
      }

      // Capture screenshot
      const result = await adapter.capture(element, finalOptions);

      // Add library info to metadata
      if (result.success && result.metadata) {
        result.metadata.library = adapter.name;
      }

      return result;
    } catch (error) {
      logger.error('Capture failed:', error);

      // If primary adapter fails, try fallback
      if (library !== this.defaultLibrary) {
        logger.info('Trying fallback with default library');
        return this.captureWithFallback(element, captureOptions);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown capture error'
      };
    }
  }

  /**
   * Capture with fallback to default library
   */
  private async captureWithFallback(
    element: HTMLElement,
    options: CaptureOptions
  ): Promise<CaptureResult> {
    try {
      const adapter = await this.getAdapter();

      let finalOptions = options;
      if (adapter.getRecommendedOptions) {
        const recommended = adapter.getRecommendedOptions();
        finalOptions = { ...recommended, ...options };
      }

      return await adapter.capture(element, finalOptions);
    } catch (error) {
      return {
        success: false,
        error: 'All capture methods failed'
      };
    }
  }

  /**
   * Check if a specific library is supported
   */
  async isLibrarySupported(library: string): Promise<boolean> {
    try {
      const factory = this.factories.get(library);
      if (!factory) {
        return false;
      }

      const adapter = factory();
      return await adapter.isSupported();
    } catch {
      return false;
    }
  }

  /**
   * Get list of available capture libraries
   */
  getAvailableLibraries(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Get current adapter info
   */
  getCurrentAdapterInfo(): { name: string; version?: string } | null {
    if (!this.currentAdapter) {
      return null;
    }

    return {
      name: this.currentAdapter.name,
      ...(this.currentAdapter.version && { version: this.currentAdapter.version })
    };
  }

  /**
   * Cleanup all adapters
   */
  cleanup(): void {
    this.adapters.forEach((adapter) => {
      if (adapter.cleanup) {
        try {
          adapter.cleanup();
        } catch (error) {
          logger.error(`Error cleaning up ${adapter.name}:`, error);
        }
      }
    });

    this.adapters.clear();
    this.currentAdapter = null;
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.cleanup();
    this.factories.clear();
    this.registerBuiltInAdapters();
    this.defaultLibrary = CaptureLibrary.HTML2CANVAS;
  }
}

// Export singleton instance
export const captureManager = CaptureManager.getInstance();
