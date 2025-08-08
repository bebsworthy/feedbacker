/**
 * Screenshot Capture Utility
 * Handles component screenshot capture with CORS handling
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { loadHtml2Canvas } from './lazyLoad';

interface ScreenshotOptions {
  quality?: number;
  backgroundColor?: string;
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
  useCORS?: boolean;
  allowTaint?: boolean;
}

interface ScreenshotResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  corsIssue?: boolean;
}

/**
 * Get the effective background color by walking up the DOM tree
 * This helps ensure text is visible in screenshots
 */
function getEffectiveBackgroundColor(element: HTMLElement): string | null {
  let currentElement: HTMLElement | null = element;
  let depth = 0;
  const maxDepth = 20; // Limit traversal to avoid performance issues
  
  while (currentElement && depth < maxDepth) {
    const computedStyle = window.getComputedStyle(currentElement);
    const bgColor = computedStyle.backgroundColor;
    
    // Check if we found a non-transparent background
    if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      // Check if it has some opacity
      const rgbaMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        const alpha = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
        if (alpha > 0.1) { // Consider backgrounds with > 10% opacity
          return bgColor;
        }
      } else {
        // RGB or hex color (non-transparent)
        return bgColor;
      }
    }
    
    // Check if we've reached the body or html element
    if (currentElement === document.body || currentElement === document.documentElement) {
      // Get the body or html background as final fallback
      const bodyBg = computedStyle.backgroundColor;
      if (bodyBg && bodyBg !== 'transparent' && bodyBg !== 'rgba(0, 0, 0, 0)') {
        return bodyBg;
      }
      
      // Use white or black based on color scheme preference
      const colorScheme = computedStyle.colorScheme || 'light';
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Check for common dark mode indicators
      const isDarkMode = colorScheme === 'dark' || 
                        prefersDark || 
                        document.documentElement.classList.contains('dark') ||
                        document.documentElement.getAttribute('data-theme') === 'dark';
      
      return isDarkMode ? '#1a1a1a' : '#ffffff';
    }
    
    currentElement = currentElement.parentElement;
    depth++;
  }
  
  // Default fallback based on system preference
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? '#1a1a1a' : '#ffffff';
}

/**
 * Capture screenshot of a specific element
 */
export async function captureElementScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  try {
    // Load html2canvas lazily (Requirement 8.4)
    const html2canvas = await loadHtml2Canvas();
    
    if (!html2canvas) {
      return {
        success: false,
        error: 'html2canvas library not available'
      };
    }

    // Detect effective background color if not provided
    const effectiveBgColor = options.backgroundColor !== undefined ? 
      options.backgroundColor : 
      getEffectiveBackgroundColor(element);
    
    const defaultOptions = {
      quality: 0.8,
      backgroundColor: effectiveBgColor, // Use detected or provided background
      scale: Math.min(window.devicePixelRatio || 1, 2), // Max 2x for performance
      useCORS: true, // Enable CORS (Requirement 8.3)
      allowTaint: false, // Prevent tainting canvas initially
      scrollX: 0,
      scrollY: 0,
      width: element.offsetWidth,
      height: element.offsetHeight,
      ...options
    };

    // First attempt with CORS enabled and no taint allowance
    try {
      const canvas = await html2canvas(element, defaultOptions);
      const dataUrl = canvas.toDataURL('image/png', defaultOptions.quality);
      
      // Apply size constraints if specified
      if (options.maxWidth || options.maxHeight) {
        const resizedDataUrl = await resizeImage(dataUrl, {
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          quality: defaultOptions.quality
        });
        
        return {
          success: true,
          dataUrl: resizedDataUrl
        };
      }
      
      return {
        success: true,
        dataUrl
      };
    } catch (corsError) {
      console.warn('[Feedbacker] CORS error during screenshot, trying with allowTaint:', corsError);
      
      // Second attempt with taint allowance for cross-origin resources (Requirement 8.2)
      try {
        const fallbackOptions = {
          ...defaultOptions,
          useCORS: false,
          allowTaint: true
        };
        
        const canvas = await html2canvas(element, fallbackOptions);
        const dataUrl = canvas.toDataURL('image/png', defaultOptions.quality);
        
        // Apply size constraints if specified
        if (options.maxWidth || options.maxHeight) {
          const resizedDataUrl = await resizeImage(dataUrl, {
            maxWidth: options.maxWidth,
            maxHeight: options.maxHeight,
            quality: defaultOptions.quality
          });
          
          return {
            success: true,
            dataUrl: resizedDataUrl
          };
        }
        
        return {
          success: true,
          dataUrl
        };
      } catch (taintError) {
        console.warn('[Feedbacker] Screenshot failed even with allowTaint:', taintError);
        
        return {
          success: false,
          error: 'Screenshot capture failed due to CORS restrictions',
          corsIssue: true
        };
      }
    }
  } catch (error) {
    console.error('[Feedbacker] Screenshot capture error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown screenshot error'
    };
  }
}

/**
 * Resize image to fit within specified constraints
 */
async function resizeImage(
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
      
      // Calculate new dimensions while maintaining aspect ratio
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
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/png', constraints.quality || 0.8));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * Capture screenshot with retry logic and graceful degradation
 */
export async function captureScreenshotWithFallback(
  element: HTMLElement,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  // First attempt with standard options
  let result = await captureElementScreenshot(element, options);
  
  if (result.success) {
    return result;
  }
  
  // If CORS issue, try with different settings
  if (result.corsIssue) {
    console.log('[Feedbacker] Retrying screenshot with fallback options');
    
    const fallbackOptions = {
      ...options,
      useCORS: false,
      allowTaint: true,
      scale: 1 // Reduce scale to avoid memory issues
    };
    
    result = await captureElementScreenshot(element, fallbackOptions);
    
    if (result.success) {
      return result;
    }
  }
  
  // Final fallback: create a placeholder image
  console.log('[Feedbacker] Creating placeholder image for failed screenshot');
  
  try {
    const placeholderDataUrl = createPlaceholderImage(
      element.offsetWidth || 200,
      element.offsetHeight || 100
    );
    
    return {
      success: true,
      dataUrl: placeholderDataUrl
    };
  } catch (placeholderError) {
    return {
      success: false,
      error: 'All screenshot methods failed, including placeholder generation'
    };
  }
}

/**
 * Create a placeholder image when screenshot capture fails
 */
function createPlaceholderImage(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create placeholder canvas context');
  }
  
  canvas.width = Math.min(width, 400);
  canvas.height = Math.min(height, 300);
  
  // Light gray background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Border
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  
  // Icon and text
  ctx.fillStyle = '#6b7280';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Camera icon (simplified)
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - 15, centerY - 20, 30, 20);
  ctx.strokeRect(centerX - 5, centerY - 15, 10, 10);
  
  // Text
  ctx.fillText('Screenshot', centerX, centerY + 15);
  ctx.fillText('unavailable', centerX, centerY + 30);
  
  return canvas.toDataURL('image/png', 0.8);
}

/**
 * Check if screenshot capture is supported in current environment
 */
export function isScreenshotSupported(): boolean {
  try {
    // Check for required APIs
    return !!(
      document.createElement('canvas').getContext &&
      window.HTMLCanvasElement &&
      window.HTMLCanvasElement.prototype.toDataURL
    );
  } catch {
    return false;
  }
}

/**
 * Get recommended screenshot options based on device capabilities
 */
export function getRecommendedOptions(): ScreenshotOptions {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  const isHighDPI = window.devicePixelRatio > 1;
  
  return {
    quality: isMobile ? 0.7 : 0.8, // Lower quality on mobile for better performance
    scale: isHighDPI ? Math.min(window.devicePixelRatio, 2) : 1,
    maxWidth: isMobile ? 800 : 1200,
    maxHeight: isMobile ? 600 : 900,
    // backgroundColor will be auto-detected if not provided
    useCORS: true,
    allowTaint: false
  };
}