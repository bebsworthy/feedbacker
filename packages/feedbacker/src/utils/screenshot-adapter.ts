/**
 * Screenshot Adapter Utility
 * Provides backward-compatible screenshot capture using the adapter system
 */

import { captureManager } from '../adapters/CaptureManager';
import { CaptureOptions, CaptureResult, CaptureAdapter } from '../types/capture';
import logger from './logger';

/**
 * Initialize capture manager with custom adapter if provided
 */
export function initializeCaptureManager(library?: string, adapter?: CaptureAdapter): void {
  if (adapter) {
    // Register custom adapter
    captureManager.registerAdapter('custom', () => adapter, true);
  } else if (library) {
    // Set default library
    try {
      captureManager.setDefaultLibrary(library);
    } catch (error) {
      logger.warn(`Failed to set library '${library}':`, error);
    }
  }
}

/**
 * Capture screenshot using the adapter system
 * This replaces the old captureScreenshotWithFallback function
 */
export async function captureScreenshotWithAdapters(
  element: HTMLElement,
  options: CaptureOptions & { library?: string; adapter?: CaptureAdapter } = {}
): Promise<CaptureResult> {
  const { library, adapter, ...captureOptions } = options;

  // Initialize if custom adapter provided
  if (adapter) {
    initializeCaptureManager(undefined, adapter);
  }

  try {
    // Use capture manager
    const result = await captureManager.capture(element, {
      ...captureOptions,
      library: library || (adapter ? 'custom' : undefined)
    });

    // Handle success
    if (result.success) {
      return result;
    }

    // Try fallback if primary failed
    logger.warn('Primary capture failed, trying fallback');
    return await captureManager.capture(element, captureOptions);
  } catch (error) {
    logger.error('Capture failed:', error);

    // Return placeholder as last resort
    return createPlaceholderResult(element);
  }
}

/**
 * Create a placeholder result when all capture methods fail
 */
function createPlaceholderResult(element: HTMLElement): CaptureResult {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return {
        success: false,
        error: 'Could not create placeholder canvas'
      };
    }

    canvas.width = Math.min(element.offsetWidth || 200, 400);
    canvas.height = Math.min(element.offsetHeight || 100, 300);

    // Light gray background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    // Text
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.fillText('Screenshot', centerX, centerY - 10);
    ctx.fillText('unavailable', centerX, centerY + 10);

    return {
      success: true,
      dataUrl: canvas.toDataURL('image/png', 0.8),
      metadata: {
        width: canvas.width,
        height: canvas.height,
        library: 'placeholder'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create placeholder image'
    };
  }
}

/**
 * Get list of available capture libraries
 */
export function getAvailableCaptureLibraries(): string[] {
  return captureManager.getAvailableLibraries();
}

/**
 * Check if a specific library is supported
 */
export async function isCaptureLibrarySupported(library: string): Promise<boolean> {
  return await captureManager.isLibrarySupported(library);
}

/**
 * Get current adapter info
 */
export function getCurrentCaptureAdapterInfo(): { name: string; version?: string } | null {
  return captureManager.getCurrentAdapterInfo();
}

/**
 * Clean up capture resources
 */
export function cleanupCaptureResources(): void {
  captureManager.cleanup();
}
