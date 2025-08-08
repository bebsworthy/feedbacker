/**
 * Data sanitization utilities for feedback data
 * Ensures data safety and prevents XSS attacks
 */

import { Feedback, Draft, ComponentInfo, BrowserInfo } from '../types';

/**
 * Sanitize a complete feedback object
 */
export function sanitizeFeedback(feedback: Feedback): Feedback {
  return {
    id: sanitizeString(feedback.id),
    componentName: sanitizeString(feedback.componentName),
    componentPath: sanitizeArray(feedback.componentPath, sanitizeString),
    comment: sanitizeComment(feedback.comment),
    screenshot: feedback.screenshot ? sanitizeDataUrl(feedback.screenshot) : undefined,
    url: sanitizeUrl(feedback.url),
    timestamp: sanitizeTimestamp(feedback.timestamp),
    browserInfo: sanitizeBrowserInfo(feedback.browserInfo),
    htmlSnippet: feedback.htmlSnippet ? sanitizeString(feedback.htmlSnippet, 5000) : undefined,
    metadata: feedback.metadata ? sanitizeMetadata(feedback.metadata) : undefined
  };
}

/**
 * Sanitize a draft object
 */
export function sanitizeDraft(draft: Draft): Draft {
  return {
    componentInfo: sanitizeComponentInfo(draft.componentInfo),
    comment: sanitizeComment(draft.comment),
    screenshot: draft.screenshot ? sanitizeDataUrl(draft.screenshot) : undefined,
    createdAt: sanitizeTimestamp(draft.createdAt),
    updatedAt: sanitizeTimestamp(draft.updatedAt)
  };
}

/**
 * Sanitize component info object
 */
export function sanitizeComponentInfo(componentInfo: ComponentInfo): ComponentInfo {
  return {
    name: sanitizeString(componentInfo.name),
    path: sanitizeArray(componentInfo.path, sanitizeString),
    element: componentInfo.element, // DOM elements are not sanitized
    htmlSnippet: componentInfo.htmlSnippet ? sanitizeString(componentInfo.htmlSnippet, 5000) : undefined,
    props: componentInfo.props ? sanitizeProps(componentInfo.props) : undefined,
    fiber: componentInfo.fiber // React fiber is not sanitized
  };
}

/**
 * Sanitize browser info object
 */
export function sanitizeBrowserInfo(browserInfo: BrowserInfo): BrowserInfo {
  return {
    userAgent: sanitizeString(browserInfo.userAgent),
    viewport: {
      width: sanitizeNumber(browserInfo.viewport.width, 1, 10000),
      height: sanitizeNumber(browserInfo.viewport.height, 1, 10000)
    },
    platform: sanitizeString(browserInfo.platform)
  };
}

/**
 * Sanitize a basic string by removing harmful content
 */
export function sanitizeString(value: string, maxLength: number = 1000): string {
  if (typeof value !== 'string') {
    return String(value || '').substring(0, maxLength);
  }

  return value
    .trim()
    .substring(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\u0000/g, ''); // Remove null characters
}

/**
 * Sanitize comment text with enhanced security
 */
export function sanitizeComment(comment: string): string {
  if (typeof comment !== 'string') {
    return '';
  }

  let sanitized = comment.trim();

  // Length limit
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  // Remove potentially harmful content
  sanitized = sanitized
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocols
    .replace(/javascript:/gi, '')
    // Remove vbscript: protocols
    .replace(/vbscript:/gi, '')
    // Remove data: URLs that could contain HTML
    .replace(/data:text\/html/gi, '')
    // Remove on* event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove form-related elements
    .replace(/<\s*\/?\s*(form|input|textarea|button|select|option)\b[^>]*>/gi, '')
    // Remove iframe and object elements
    .replace(/<\s*\/?\s*(iframe|object|embed|applet)\b[^>]*>/gi, '')
    // Remove link and style elements
    .replace(/<\s*\/?\s*(link|style)\b[^>]*>/gi, '')
    // Remove meta elements
    .replace(/<\s*meta\b[^>]*>/gi, '')
    // Clean up control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Sanitize a URL
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return window.location.href;
  }

  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return window.location.href;
    }

    // Limit URL length
    if (url.length > 2000) {
      return window.location.href;
    }

    return url;
  } catch (error) {
    // Invalid URL, fallback to current page
    return window.location.href;
  }
}

/**
 * Sanitize timestamp
 */
export function sanitizeTimestamp(timestamp: string): string {
  if (typeof timestamp !== 'string') {
    return new Date().toISOString();
  }

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    // Ensure timestamp is not in the future (with 1 minute tolerance)
    const now = new Date();
    const maxAllowed = new Date(now.getTime() + 60000);
    if (date > maxAllowed) {
      return now.toISOString();
    }

    // Ensure timestamp is not too old (more than 10 years)
    const minAllowed = new Date(now.getTime() - (10 * 365 * 24 * 60 * 60 * 1000));
    if (date < minAllowed) {
      return now.toISOString();
    }

    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * Sanitize data URL (for screenshots)
 */
export function sanitizeDataUrl(dataUrl: string): string {
  if (typeof dataUrl !== 'string') {
    return '';
  }

  // Check if it's a valid data URL format
  const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)$/;
  if (!dataUrlPattern.test(dataUrl)) {
    return '';
  }

  // Check size (approximate, base64 is ~1.33x the binary size)
  const estimatedSize = dataUrl.length * 0.75;
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (estimatedSize > maxSize) {
    return '';
  }

  return dataUrl;
}

/**
 * Sanitize a number with bounds
 */
export function sanitizeNumber(value: number, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.floor(value)));
}

/**
 * Sanitize an array by applying a sanitizer function to each element
 */
export function sanitizeArray<T>(array: T[], sanitizer: (item: T) => T): T[] {
  if (!Array.isArray(array)) {
    return [];
  }

  return array
    .slice(0, 100) // Limit array size
    .map(sanitizer)
    .filter(item => item !== null && item !== undefined);
}

/**
 * Sanitize component props object
 */
export function sanitizeProps(props: Record<string, any>): Record<string, any> {
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    return {};
  }

  const sanitized: Record<string, any> = {};
  const maxProps = 50; // Limit number of props
  let propCount = 0;

  for (const [key, value] of Object.entries(props)) {
    if (propCount >= maxProps) break;

    const sanitizedKey = sanitizeString(key, 100);
    if (sanitizedKey) {
      sanitized[sanitizedKey] = sanitizeValue(value);
      propCount++;
    }
  }

  return sanitized;
}

/**
 * Sanitize metadata object
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const sanitized: Record<string, any> = {};
  const maxEntries = 20; // Limit number of metadata entries
  let entryCount = 0;

  for (const [key, value] of Object.entries(metadata)) {
    if (entryCount >= maxEntries) break;

    const sanitizedKey = sanitizeString(key, 50);
    if (sanitizedKey) {
      sanitized[sanitizedKey] = sanitizeValue(value);
      entryCount++;
    }
  }

  return sanitized;
}

/**
 * Sanitize a generic value based on its type
 */
function sanitizeValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  switch (typeof value) {
    case 'string':
      return sanitizeString(value, 500);
    case 'number':
      return sanitizeNumber(value);
    case 'boolean':
      return Boolean(value);
    case 'object':
      if (Array.isArray(value)) {
        return value.slice(0, 10).map(sanitizeValue); // Limit array size
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      // For other objects, limit depth to prevent infinite recursion
      return sanitizeShallowObject(value);
    default:
      return String(value).substring(0, 100);
  }
}

/**
 * Sanitize an object with limited depth
 */
function sanitizeShallowObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  let entryCount = 0;

  for (const [key, value] of Object.entries(obj)) {
    if (entryCount >= 10) break; // Limit number of properties

    const sanitizedKey = sanitizeString(key, 50);
    if (sanitizedKey) {
      // Only sanitize primitive values to avoid deep recursion
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = sanitizeValue(value);
      } else {
        sanitized[sanitizedKey] = '[Object]';
      }
      entryCount++;
    }
  }

  return sanitized;
}

/**
 * Remove potentially harmful HTML/JS from text
 */
export function stripHtmlTags(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&[#\w]+;/g, '') // Remove HTML entities
    .trim();
}

/**
 * Escape HTML characters in text
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return text.replace(/[&<>"'\/]/g, match => htmlEscapes[match] || match);
}

/**
 * Generate a safe filename from a string
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return 'feedback';
  }

  return filename
    .trim()
    .substring(0, 100)
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}