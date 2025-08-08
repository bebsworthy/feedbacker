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
 * Detect if an element uses gradient text effect or other problematic CSS
 */
function hasGradientText(element: HTMLElement): boolean {
  const computedStyle = window.getComputedStyle(element);
  
  // Check for transparent text fill
  const textFillColor = computedStyle.getPropertyValue('-webkit-text-fill-color');
  const isTransparentFill = textFillColor === 'transparent' || 
                            textFillColor === 'rgba(0, 0, 0, 0)' ||
                            textFillColor.includes('transparent');
  
  // Check for background-clip: text
  const backgroundClip = computedStyle.getPropertyValue('background-clip') || 
                         computedStyle.getPropertyValue('-webkit-background-clip');
  const hasTextClip = backgroundClip === 'text' || backgroundClip.includes('text');
  
  // Check if element has gradient background
  const backgroundImage = computedStyle.backgroundImage;
  const hasGradient = backgroundImage.includes('gradient');
  
  // Return true if it's a gradient text element OR has problematic combination
  return (isTransparentFill && hasTextClip) || (hasGradient && hasTextClip);
}

/**
 * Get all elements with gradient text within a container
 */
function findGradientTextElements(container: HTMLElement): HTMLElement[] {
  const elements: HTMLElement[] = [];
  
  // Check the container itself
  if (hasGradientText(container)) {
    elements.push(container);
  }
  
  // Check all descendants
  const allElements = container.querySelectorAll('*');
  allElements.forEach(el => {
    if (el instanceof HTMLElement && hasGradientText(el)) {
      elements.push(el);
    }
  });
  
  return elements;
}

/**
 * Temporarily fix gradient text and problematic CSS for screenshot capture
 * Returns a restore function to revert changes
 */
function temporarilyFixGradientText(elements: HTMLElement[]): () => void {
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
    
    // Store original inline styles
    originalStyles.set(element, {
      webkitTextFillColor: element.style.webkitTextFillColor || '',
      color: element.style.color || '',
      backgroundClip: element.style.backgroundClip || '',
      webkitBackgroundClip: element.style.webkitBackgroundClip || '',
      animation: element.style.animation || '',
      opacity: element.style.opacity || '',
      transform: element.style.transform || ''
    });
    
    // Extract a color from the gradient or use a fallback
    const gradient = computedStyle.backgroundImage;
    let extractedColor = '#667eea'; // Default purple color
    
    // Try to extract first color from gradient
    const colorMatch = gradient.match(/#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgba?\([^)]+\)/);
    if (colorMatch) {
      extractedColor = colorMatch[0];
    } else {
      // Use theme-appropriate color
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                    document.documentElement.classList.contains('dark');
      extractedColor = isDark ? '#a78bfa' : '#7c3aed'; // Purple shades
    }
    
    console.log(`[Feedbacker] Fixing gradient text for ${element.tagName}.${element.className}, using color: ${extractedColor}`);
    
    // Apply temporary solid color and disable problematic CSS
    element.style.setProperty('-webkit-text-fill-color', extractedColor, 'important');
    element.style.setProperty('color', extractedColor, 'important');
    element.style.setProperty('background-clip', 'border-box', 'important');
    element.style.setProperty('-webkit-background-clip', 'border-box', 'important');
    element.style.setProperty('animation', 'none', 'important');
    element.style.setProperty('opacity', '1', 'important');
    element.style.setProperty('transform', 'none', 'important');
  });
  
  // Return restore function
  return () => {
    originalStyles.forEach((styles, element) => {
      // Restore or remove each property
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

    // Find and temporarily fix gradient text elements
    const gradientTextElements = findGradientTextElements(element);
    let restoreGradientText: (() => void) | null = null;
    
    if (gradientTextElements.length > 0) {
      console.log('[Feedbacker] Found gradient text elements, applying temporary fix');
      restoreGradientText = temporarilyFixGradientText(gradientTextElements);
      
      // Small delay to ensure browser has rendered the changes
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // First attempt with CORS enabled and no taint allowance
    try {
      const canvas = await html2canvas(element, defaultOptions);
      const dataUrl = canvas.toDataURL('image/png', defaultOptions.quality);
      
      // Restore gradient text after capture
      if (restoreGradientText) {
        restoreGradientText();
      }
      
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
        
        // Restore gradient text after capture
        if (restoreGradientText) {
          restoreGradientText();
        }
        
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
    // Restore gradient text on error
    if (restoreGradientText) {
      restoreGradientText();
    }
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