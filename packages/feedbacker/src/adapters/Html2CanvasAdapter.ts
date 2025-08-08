/**
 * Html2Canvas Adapter
 * Wraps html2canvas library for screenshot capture
 */

import { CaptureAdapter, CaptureOptions, CaptureResult } from '../types/capture';
import { loadHtml2Canvas } from '../utils/lazyLoad';

export class Html2CanvasAdapter implements CaptureAdapter {
  name = 'html2canvas';
  version = '1.4.1';
  private html2canvas: any = null;
  private gradientTextElements: Map<HTMLElement, any> = new Map();

  async isSupported(): Promise<boolean> {
    try {
      // Check for required browser APIs
      const canvas = document.createElement('canvas');
      return !!(
        canvas.getContext('2d') &&
        window.HTMLCanvasElement &&
        window.HTMLCanvasElement.prototype.toDataURL
      );
    } catch {
      return false;
    }
  }

  async preload(): Promise<void> {
    if (!this.html2canvas) {
      this.html2canvas = await loadHtml2Canvas();
    }
  }

  async capture(element: HTMLElement, options: CaptureOptions = {}): Promise<CaptureResult> {
    try {
      // Ensure library is loaded
      if (!this.html2canvas) {
        await this.preload();
      }

      if (!this.html2canvas) {
        return {
          success: false,
          error: 'html2canvas library not available'
        };
      }

      // Detect effective background color if not provided
      const effectiveBgColor = options.backgroundColor !== undefined ? 
        options.backgroundColor : 
        this.getEffectiveBackgroundColor(element);

      const captureOptions = {
        quality: options.quality || 0.8,
        backgroundColor: effectiveBgColor,
        scale: options.scale || Math.min(window.devicePixelRatio || 1, 2),
        useCORS: options.useCORS !== undefined ? options.useCORS : true,
        allowTaint: options.allowTaint !== undefined ? options.allowTaint : false,
        scrollX: 0,
        scrollY: 0,
        width: element.offsetWidth,
        height: element.offsetHeight,
        timeout: options.timeout || 15000
      };

      // Find and temporarily fix gradient text elements
      const gradientTextElements = this.findGradientTextElements(element);
      let restoreGradientText: (() => void) | null = null;
      
      if (gradientTextElements.length > 0) {
        console.log('[Html2CanvasAdapter] Found gradient text elements, applying temporary fix');
        restoreGradientText = this.temporarilyFixGradientText(gradientTextElements);
        
        // Small delay to ensure browser has rendered the changes
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // First attempt with CORS enabled
      try {
        const canvas = await this.html2canvas(element, captureOptions);
        const dataUrl = canvas.toDataURL('image/png', captureOptions.quality);
        
        // Restore gradient text after capture
        if (restoreGradientText) {
          restoreGradientText();
        }
        
        // Apply size constraints if specified
        let finalDataUrl = dataUrl;
        if (options.maxWidth || options.maxHeight) {
          finalDataUrl = await this.resizeImage(dataUrl, {
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            quality: captureOptions.quality
          });
        }
        
        return {
          success: true,
          dataUrl: finalDataUrl,
          metadata: {
            width: canvas.width,
            height: canvas.height,
            captureTime: Date.now(),
            library: this.name
          }
        };
      } catch (corsError) {
        console.warn('[Html2CanvasAdapter] CORS error, trying with allowTaint:', corsError);
        
        // Second attempt with taint allowance
        const fallbackOptions = {
          ...captureOptions,
          useCORS: false,
          allowTaint: true
        };
        
        try {
          const canvas = await this.html2canvas(element, fallbackOptions);
          const dataUrl = canvas.toDataURL('image/png', captureOptions.quality);
          
          // Restore gradient text after capture
          if (restoreGradientText) {
            restoreGradientText();
          }
          
          // Apply size constraints if specified
          let finalDataUrl = dataUrl;
          if (options.maxWidth || options.maxHeight) {
            finalDataUrl = await this.resizeImage(dataUrl, {
              maxWidth: options.maxWidth,
              maxHeight: options.maxHeight,
              quality: captureOptions.quality
            });
          }
          
          return {
            success: true,
            dataUrl: finalDataUrl,
            corsIssue: true,
            metadata: {
              width: canvas.width,
              height: canvas.height,
              captureTime: Date.now(),
              library: this.name
            }
          };
        } catch (taintError) {
          // Restore gradient text on error
          if (restoreGradientText) {
            restoreGradientText();
          }
          
          return {
            success: false,
            error: 'Screenshot capture failed due to CORS restrictions',
            corsIssue: true
          };
        }
      }
    } catch (error) {
      console.error('[Html2CanvasAdapter] Capture error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown capture error'
      };
    }
  }

  cleanup(): void {
    // Clear any stored references
    this.gradientTextElements.clear();
    this.html2canvas = null;
  }

  getRecommendedOptions(): CaptureOptions {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    const isHighDPI = window.devicePixelRatio > 1;
    
    return {
      quality: isMobile ? 0.7 : 0.8,
      scale: isHighDPI ? Math.min(window.devicePixelRatio, 2) : 1,
      maxWidth: isMobile ? 800 : 1200,
      maxHeight: isMobile ? 600 : 900,
      useCORS: true,
      allowTaint: false
    };
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
   * Detect if an element uses gradient text effect
   */
  private hasGradientText(element: HTMLElement): boolean {
    const computedStyle = window.getComputedStyle(element);
    
    const textFillColor = computedStyle.getPropertyValue('-webkit-text-fill-color');
    const isTransparentFill = textFillColor === 'transparent' || 
                              textFillColor === 'rgba(0, 0, 0, 0)' ||
                              textFillColor.includes('transparent');
    
    const backgroundClip = computedStyle.getPropertyValue('background-clip') || 
                           computedStyle.getPropertyValue('-webkit-background-clip');
    const hasTextClip = backgroundClip === 'text' || backgroundClip.includes('text');
    
    const backgroundImage = computedStyle.backgroundImage;
    const hasGradient = backgroundImage.includes('gradient');
    
    return (isTransparentFill && hasTextClip) || (hasGradient && hasTextClip);
  }

  /**
   * Find all elements with gradient text within a container
   */
  private findGradientTextElements(container: HTMLElement): HTMLElement[] {
    const elements: HTMLElement[] = [];
    
    if (this.hasGradientText(container)) {
      elements.push(container);
    }
    
    const allElements = container.querySelectorAll('*');
    allElements.forEach(el => {
      if (el instanceof HTMLElement && this.hasGradientText(el)) {
        elements.push(el);
      }
    });
    
    return elements;
  }

  /**
   * Temporarily fix gradient text for screenshot capture
   */
  private temporarilyFixGradientText(elements: HTMLElement[]): () => void {
    const originalStyles: Map<HTMLElement, {
      webkitTextFillColor: string;
      color: string;
      backgroundClip: string;
      webkitBackgroundClip: string;
      animation: string;
      opacity: string;
      transform: string;
    }> = new Map();
    
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      
      originalStyles.set(element, {
        webkitTextFillColor: element.style.webkitTextFillColor || '',
        color: element.style.color || '',
        backgroundClip: element.style.backgroundClip || '',
        webkitBackgroundClip: element.style.webkitBackgroundClip || '',
        animation: element.style.animation || '',
        opacity: element.style.opacity || '',
        transform: element.style.transform || ''
      });
      
      const gradient = computedStyle.backgroundImage;
      let extractedColor = '#667eea';
      
      const colorMatch = gradient.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\)/);
      if (colorMatch) {
        extractedColor = colorMatch[0];
      } else {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                      document.documentElement.classList.contains('dark');
        extractedColor = isDark ? '#a78bfa' : '#7c3aed';
      }
      
      element.style.setProperty('-webkit-text-fill-color', extractedColor, 'important');
      element.style.setProperty('color', extractedColor, 'important');
      element.style.setProperty('background-clip', 'border-box', 'important');
      element.style.setProperty('-webkit-background-clip', 'border-box', 'important');
      element.style.setProperty('animation', 'none', 'important');
      element.style.setProperty('opacity', '1', 'important');
      element.style.setProperty('transform', 'none', 'important');
    });
    
    return () => {
      originalStyles.forEach((styles, element) => {
        if (styles.webkitTextFillColor) {
          element.style.webkitTextFillColor = styles.webkitTextFillColor;
        } else {
          element.style.removeProperty('-webkit-text-fill-color');
        }
        
        if (styles.color) {
          element.style.color = styles.color;
        } else {
          element.style.removeProperty('color');
        }
        
        if (styles.backgroundClip) {
          element.style.backgroundClip = styles.backgroundClip;
        } else {
          element.style.removeProperty('background-clip');
        }
        
        if (styles.webkitBackgroundClip) {
          element.style.webkitBackgroundClip = styles.webkitBackgroundClip;
        } else {
          element.style.removeProperty('-webkit-background-clip');
        }
        
        if (styles.animation) {
          element.style.animation = styles.animation;
        } else {
          element.style.removeProperty('animation');
        }
        
        if (styles.opacity) {
          element.style.opacity = styles.opacity;
        } else {
          element.style.removeProperty('opacity');
        }
        
        if (styles.transform) {
          element.style.transform = styles.transform;
        } else {
          element.style.removeProperty('transform');
        }
      });
    };
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