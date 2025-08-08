/**
 * SnapDOM Adapter
 * Wraps SnapDOM library for screenshot capture
 * SnapDOM is a more modern alternative to html2canvas with better performance
 */

import { CaptureAdapter, CaptureOptions, CaptureResult } from '../types/capture';

export class SnapDOMAdapter implements CaptureAdapter {
  name = 'snapdom';
  version = 'latest';
  private snapdom: any = null;
  private scriptLoaded = false;

  async isSupported(): Promise<boolean> {
    try {
      // Check for required browser APIs
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext &&
        window.HTMLCanvasElement &&
        window.HTMLCanvasElement.prototype.toDataURL &&
        // SnapDOM requires modern browser features
        window.MutationObserver &&
        window.ResizeObserver
      );
    } catch {
      return false;
    }
  }

  async preload(): Promise<void> {
    if (this.scriptLoaded) {
      return;
    }

    try {
      // First try to import from npm package if installed
      try {
        const { snapdom } = await import('@zumer/snapdom');
        // Store the snapdom function
        this.snapdom = snapdom;
        (window as any).snapdom = snapdom;
        this.scriptLoaded = true;
        console.log('[SnapDOMAdapter] Loaded from npm package');
        return;
      } catch (npmError) {
        console.log('[SnapDOMAdapter] npm package not found, trying CDN fallback:', npmError);
      }

      // Fall back to loading from CDN
      await this.loadSnapDOMScript();
      this.scriptLoaded = true;
    } catch (error) {
      console.error('[SnapDOMAdapter] Failed to preload:', error);
      throw error;
    }
  }

  async capture(element: HTMLElement, options: CaptureOptions = {}): Promise<CaptureResult> {
    try {
      // Ensure library is loaded
      if (!this.scriptLoaded) {
        await this.preload();
      }

      // Check if snapdom is available
      const snapdom = this.snapdom || (window as any).snapdom || (window as any).SnapDOM;
      if (!snapdom) {
        return {
          success: false,
          error: 'SnapDOM library not available'
        };
      }

      // Prepare SnapDOM options
      const snapOptions = this.prepareSnapDOMOptions(element, options);

      // Take snapshot using the snapdom function or its toCanvas method
      const startTime = Date.now();
      let canvas: HTMLCanvasElement;
      
      try {
        // snapdom.toCanvas returns a canvas directly
        if (typeof snapdom.toCanvas === 'function') {
          canvas = await snapdom.toCanvas(element, snapOptions);
        } else if (typeof snapdom === 'function') {
          // If snapdom is the main function, call it and convert to canvas
          const result = await snapdom(element, snapOptions);
          canvas = await result.toCanvas();
        } else {
          throw new Error('SnapDOM API not recognized');
        }
      } catch (snapError) {
        console.error('[SnapDOMAdapter] Snapshot creation failed:', snapError);
        throw snapError;
      }
      
      if (!canvas) {
        return {
          success: false,
          error: 'SnapDOM capture returned null'
        };
      }

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png', options.quality || 0.8);
      
      // Apply size constraints if specified
      let finalDataUrl = dataUrl;
      if (options.maxWidth || options.maxHeight) {
        finalDataUrl = await this.resizeImage(dataUrl, {
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          quality: options.quality || 0.8
        });
      }

      const captureTime = Date.now() - startTime;
      
      return {
        success: true,
        dataUrl: finalDataUrl,
        metadata: {
          width: canvas.width,
          height: canvas.height,
          captureTime,
          library: this.name
        }
      };
    } catch (error) {
      console.error('[SnapDOMAdapter] Capture error:', error);
      
      // Check if it's a CORS issue
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError = errorMessage.toLowerCase().includes('cors') || 
                         errorMessage.toLowerCase().includes('cross-origin');
      
      return {
        success: false,
        error: errorMessage,
        corsIssue: isCorsError
      };
    }
  }

  cleanup(): void {
    // Clean up any resources
    this.snapdom = null;
  }

  getRecommendedOptions(): CaptureOptions {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    const isHighDPI = window.devicePixelRatio > 1;
    
    return {
      quality: isMobile ? 0.8 : 0.9, // SnapDOM handles quality better
      scale: isHighDPI ? Math.min(window.devicePixelRatio, 2) : 1,
      maxWidth: isMobile ? 1024 : 1920,
      maxHeight: isMobile ? 768 : 1080,
      backgroundColor: null, // Let SnapDOM detect it
      useCORS: true
    };
  }

  /**
   * Load SnapDOM script from CDN
   */
  private async loadSnapDOMScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).SnapDOM) {
        this.snapdom = (window as any).SnapDOM;
        resolve();
        return;
      }

      const script = document.createElement('script');
      // Using jsdelivr CDN for SnapDOM
      script.src = 'https://cdn.jsdelivr.net/npm/@zumerlab/snapdom@latest/dist/snapdom.min.js';
      script.async = true;
      
      script.onload = () => {
        // Check for both possible global names
        const snapdomGlobal = (window as any).snapdom || (window as any).SnapDOM;
        if (snapdomGlobal) {
          this.snapdom = snapdomGlobal;
          resolve();
        } else {
          reject(new Error('SnapDOM not available after loading script'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load SnapDOM from CDN'));
      };
      
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="snapdom"]');
      if (!existingScript) {
        document.head.appendChild(script);
      } else {
        // Wait for existing script to load
        const snapdomGlobal = (window as any).snapdom || (window as any).SnapDOM;
        if (snapdomGlobal) {
          this.snapdom = snapdomGlobal;
          resolve();
        } else {
          // Set up observer to wait for SnapDOM to be available
          let attempts = 0;
          const checkInterval = setInterval(() => {
            attempts++;
            const snapdomCheck = (window as any).snapdom || (window as any).SnapDOM;
            if (snapdomCheck) {
              clearInterval(checkInterval);
              this.snapdom = snapdomCheck;
              resolve();
            } else if (attempts > 50) { // 5 seconds timeout
              clearInterval(checkInterval);
              reject(new Error('SnapDOM script present but library not available'));
            }
          }, 100);
        }
      }
    });
  }

  /**
   * Prepare SnapDOM-specific options
   */
  private prepareSnapDOMOptions(element: HTMLElement, options: CaptureOptions): any {
    const snapOptions: any = {
      // Basic options
      quality: options.quality || 0.8,
      scale: options.scale || Math.min(window.devicePixelRatio || 1, 2),
      
      // SnapDOM specific options
      preserveDrawingBuffer: true,
      removeHiddenElements: true,
      flattenShadowDOM: true,
      captureBeyondViewport: true,
      
      // Performance options
      useWorker: true, // Use web worker if available
      cacheStyleSheets: true,
      
      // CORS handling
      useCORS: options.useCORS !== undefined ? options.useCORS : true,
      allowTaint: options.allowTaint !== undefined ? options.allowTaint : false
    };

    // Handle background color
    if (options.backgroundColor !== undefined) {
      snapOptions.backgroundColor = options.backgroundColor;
    } else {
      // Let SnapDOM auto-detect, but provide fallback
      snapOptions.backgroundColor = this.getEffectiveBackgroundColor(element);
    }

    // Add timeout if specified
    if (options.timeout) {
      snapOptions.timeout = options.timeout;
    }

    return snapOptions;
  }

  /**
   * Convert SnapDOM snapshot to canvas
   */
  private async snapshotToCanvas(snapshot: any, options: CaptureOptions): Promise<HTMLCanvasElement> {
    const SnapDOM = this.snapdom || (window as any).SnapDOM;
    
    if (SnapDOM.toCanvas) {
      // If SnapDOM provides a toCanvas method
      return await SnapDOM.toCanvas(snapshot, {
        quality: options.quality || 0.8,
        scale: options.scale || 1
      });
    }
    
    // Fallback: Create canvas manually
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // If snapshot is already a canvas or image
    if (snapshot instanceof HTMLCanvasElement) {
      canvas.width = snapshot.width;
      canvas.height = snapshot.height;
      ctx.drawImage(snapshot, 0, 0);
      return canvas;
    }
    
    if (snapshot instanceof HTMLImageElement) {
      canvas.width = snapshot.width;
      canvas.height = snapshot.height;
      ctx.drawImage(snapshot, 0, 0);
      return canvas;
    }

    // If snapshot is a blob or data URL
    if (snapshot instanceof Blob) {
      const url = URL.createObjectURL(snapshot);
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas);
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load snapshot blob'));
        };
        
        img.src = url;
      });
    }

    throw new Error('Unknown snapshot format from SnapDOM');
  }

  /**
   * Get the effective background color by walking up the DOM tree
   */
  private getEffectiveBackgroundColor(element: HTMLElement): string | null {
    let currentElement: HTMLElement | null = element.parentElement;
    let depth = 0;
    const maxDepth = 20;
    
    while (currentElement && depth < maxDepth) {
      const computedStyle = window.getComputedStyle(currentElement);
      const bgColor = computedStyle.backgroundColor;
      
      if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
        const rgbaMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
          const alpha = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
          if (alpha > 0.1) {
            return bgColor;
          }
        } else {
          return bgColor;
        }
      }
      
      if (currentElement === document.body || currentElement === document.documentElement) {
        const bodyBg = computedStyle.backgroundColor;
        if (bodyBg && bodyBg !== 'transparent' && bodyBg !== 'rgba(0, 0, 0, 0)') {
          return bodyBg;
        }
        
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDarkMode = computedStyle.colorScheme === 'dark' || 
                          prefersDark || 
                          document.documentElement.classList.contains('dark') ||
                          document.documentElement.getAttribute('data-theme') === 'dark';
        
        return isDarkMode ? '#1a1a1a' : '#ffffff';
      }
      
      currentElement = currentElement.parentElement;
      depth++;
    }
    
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? '#1a1a1a' : '#ffffff';
  }

  /**
   * Resize image to fit within specified constraints
   */
  private async resizeImage(
    dataUrl: string,
    constraints: { maxWidth?: number; maxHeight?: number; quality?: number }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        let { width, height } = img;
        
        if (constraints.maxWidth && width > constraints.maxWidth) {
          height = (height * constraints.maxWidth) / width;
          width = constraints.maxWidth;
        }
        
        if (constraints.maxHeight && height > constraints.maxHeight) {
          width = (width * constraints.maxHeight) / height;
          height = constraints.maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/png', constraints.quality || 0.8));
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for resizing'));
      };
      
      img.src = dataUrl;
    });
  }
}