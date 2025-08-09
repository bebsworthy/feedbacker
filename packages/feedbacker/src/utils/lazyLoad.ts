/**
 * Lazy Loading Utility
 * Handles dynamic importing of external libraries
 *
 * Requirements: 8.4, 10.5
 */

import logger from './logger';

interface LazyLoadCache {
  [key: string]: Promise<any>;
}

// Cache to prevent multiple loads of the same module
const loadCache: LazyLoadCache = {};

/**
 * Lazy load html2canvas library
 * Only loads when screenshot functionality is needed
 */
export async function loadHtml2Canvas(): Promise<any> {
  const cacheKey = 'html2canvas';

  // Return cached promise if already loading/loaded
  if (cacheKey in loadCache) {
    return loadCache[cacheKey];
  }

  // Create promise and cache it
  loadCache[cacheKey] = (async () => {
    try {
      // Try to import from CDN as fallback
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.async = true;

      return new Promise((resolve, reject) => {
        script.onload = () => {
          // Check if html2canvas is available
          if (typeof (window as any).html2canvas === 'function') {
            resolve((window as any).html2canvas);
          } else {
            reject(new Error('html2canvas not available after loading'));
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load html2canvas from CDN'));
        };

        // Only append if not already present
        const existingScript = document.querySelector('script[src*="html2canvas"]');
        if (!existingScript) {
          document.head.appendChild(script);
        } else {
          // Script already exists, check if html2canvas is available
          if (typeof (window as any).html2canvas === 'function') {
            resolve((window as any).html2canvas);
          } else {
            reject(new Error('html2canvas script present but not available'));
          }
        }
      });
    } catch (error) {
      logger.error('Error loading html2canvas:', error);
      throw error;
    }
  })();

  return loadCache[cacheKey];
}

/**
 * Generic lazy loader for external libraries
 */
export async function lazyLoad<T>(
  moduleFactory: () => Promise<T>,
  cacheKey: string,
  fallback?: () => Promise<T>
): Promise<T> {
  if (cacheKey in loadCache) {
    return loadCache[cacheKey];
  }

  loadCache[cacheKey] = (async () => {
    try {
      return await moduleFactory();
    } catch (error) {
      logger.error(`Error loading ${cacheKey}:`, error);

      // Try fallback if provided
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          logger.error(`Fallback for ${cacheKey} also failed:`, fallbackError);
          throw fallbackError;
        }
      }

      throw error;
    }
  })();

  return loadCache[cacheKey];
}

/**
 * Check if a library is already loaded
 */
export function isLibraryLoaded(cacheKey: string): boolean {
  return cacheKey in loadCache;
}

/**
 * Clear the load cache (useful for testing)
 */
export function clearLoadCache(): void {
  Object.keys(loadCache).forEach((key) => {
    delete loadCache[key];
  });
}
