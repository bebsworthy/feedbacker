/**
 * Validation utilities for feedback data
 * Ensures data integrity and type safety
 */

import { Feedback, Draft, ComponentInfo, BrowserInfo } from '../types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a complete feedback object
 */
export function validateFeedback(feedback: Partial<Feedback>): ValidationResult {
  const errors: string[] = [];

  // Required fields validation
  if (!feedback.id || typeof feedback.id !== 'string') {
    errors.push('Feedback ID is required and must be a string');
  }

  if (!feedback.componentName || typeof feedback.componentName !== 'string') {
    errors.push('Component name is required and must be a string');
  }

  if (!feedback.comment || typeof feedback.comment !== 'string' || feedback.comment.trim() === '') {
    errors.push('Comment is required and must be a non-empty string');
  }

  if (!feedback.timestamp || typeof feedback.timestamp !== 'string') {
    errors.push('Timestamp is required and must be a string');
  } else {
    // Validate timestamp format
    const timestamp = new Date(feedback.timestamp);
    if (isNaN(timestamp.getTime())) {
      errors.push('Timestamp must be a valid date string');
    }
  }

  if (!feedback.url || typeof feedback.url !== 'string') {
    errors.push('URL is required and must be a string');
  } else {
    // Basic URL validation
    try {
      new URL(feedback.url);
    } catch {
      errors.push('URL must be a valid URL format');
    }
  }

  // Optional fields validation
  if (feedback.componentPath !== undefined) {
    if (!Array.isArray(feedback.componentPath)) {
      errors.push('Component path must be an array');
    } else {
      const invalidPaths = feedback.componentPath.filter(path => typeof path !== 'string');
      if (invalidPaths.length > 0) {
        errors.push('All component path items must be strings');
      }
    }
  }

  if (feedback.screenshot !== undefined) {
    if (typeof feedback.screenshot !== 'string') {
      errors.push('Screenshot must be a string');
    } else {
      // Validate base64 data URL format
      if (!feedback.screenshot.startsWith('data:image/')) {
        errors.push('Screenshot must be a valid data URL');
      }
    }
  }

  if (feedback.browserInfo !== undefined) {
    const browserValidation = validateBrowserInfo(feedback.browserInfo);
    if (!browserValidation.valid) {
      errors.push(...browserValidation.errors.map(err => `Browser info: ${err}`));
    }
  }

  if (feedback.metadata !== undefined) {
    if (typeof feedback.metadata !== 'object' || feedback.metadata === null || Array.isArray(feedback.metadata)) {
      errors.push('Metadata must be an object');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a draft object
 */
export function validateDraft(draft: Partial<Draft>): ValidationResult {
  const errors: string[] = [];

  if (!draft.componentInfo) {
    errors.push('Component info is required');
  } else {
    const componentValidation = validateComponentInfo(draft.componentInfo);
    if (!componentValidation.valid) {
      errors.push(...componentValidation.errors.map(err => `Component info: ${err}`));
    }
  }

  if (!draft.comment || typeof draft.comment !== 'string') {
    errors.push('Comment is required and must be a string');
  }

  if (!draft.createdAt || typeof draft.createdAt !== 'string') {
    errors.push('Created date is required and must be a string');
  } else {
    const createdAt = new Date(draft.createdAt);
    if (isNaN(createdAt.getTime())) {
      errors.push('Created date must be a valid date string');
    }
  }

  if (!draft.updatedAt || typeof draft.updatedAt !== 'string') {
    errors.push('Updated date is required and must be a string');
  } else {
    const updatedAt = new Date(draft.updatedAt);
    if (isNaN(updatedAt.getTime())) {
      errors.push('Updated date must be a valid date string');
    }
  }

  if (draft.screenshot !== undefined) {
    if (typeof draft.screenshot !== 'string') {
      errors.push('Screenshot must be a string');
    } else {
      if (!draft.screenshot.startsWith('data:image/')) {
        errors.push('Screenshot must be a valid data URL');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate component info object
 */
export function validateComponentInfo(componentInfo: Partial<ComponentInfo>): ValidationResult {
  const errors: string[] = [];

  if (!componentInfo.name || typeof componentInfo.name !== 'string') {
    errors.push('Component name is required and must be a string');
  }

  if (!componentInfo.path || !Array.isArray(componentInfo.path)) {
    errors.push('Component path is required and must be an array');
  } else {
    const invalidPaths = componentInfo.path.filter(path => typeof path !== 'string');
    if (invalidPaths.length > 0) {
      errors.push('All component path items must be strings');
    }
  }

  if (!componentInfo.element) {
    errors.push('Component element is required');
  } else {
    // Check if it's a DOM element (in browser environment)
    if (typeof window !== 'undefined' && !(componentInfo.element instanceof HTMLElement)) {
      errors.push('Component element must be an HTMLElement');
    }
  }

  if (componentInfo.props !== undefined) {
    if (typeof componentInfo.props !== 'object' || componentInfo.props === null || Array.isArray(componentInfo.props)) {
      errors.push('Component props must be an object');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate browser info object
 */
export function validateBrowserInfo(browserInfo: Partial<BrowserInfo>): ValidationResult {
  const errors: string[] = [];

  if (!browserInfo.userAgent || typeof browserInfo.userAgent !== 'string') {
    errors.push('User agent is required and must be a string');
  }

  if (!browserInfo.viewport) {
    errors.push('Viewport info is required');
  } else {
    if (typeof browserInfo.viewport !== 'object' || browserInfo.viewport === null) {
      errors.push('Viewport must be an object');
    } else {
      if (typeof browserInfo.viewport.width !== 'number' || browserInfo.viewport.width <= 0) {
        errors.push('Viewport width must be a positive number');
      }
      if (typeof browserInfo.viewport.height !== 'number' || browserInfo.viewport.height <= 0) {
        errors.push('Viewport height must be a positive number');
      }
    }
  }

  if (!browserInfo.platform || typeof browserInfo.platform !== 'string') {
    errors.push('Platform is required and must be a string');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate feedback store structure
 */
export function validateStorageData(data: any): boolean {
  try {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    if (typeof data.version !== 'string') {
      return false;
    }

    if (!Array.isArray(data.feedbacks)) {
      return false;
    }

    // Validate each feedback item (basic validation)
    for (const feedback of data.feedbacks) {
      if (!feedback.id || !feedback.componentName || !feedback.comment) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate comment content
 */
export function validateComment(comment: string): ValidationResult {
  const errors: string[] = [];

  if (typeof comment !== 'string') {
    errors.push('Comment must be a string');
    return { valid: false, errors };
  }

  const trimmed = comment.trim();

  if (trimmed.length === 0) {
    errors.push('Comment cannot be empty');
  }

  if (trimmed.length > 10000) {
    errors.push('Comment is too long (maximum 10000 characters)');
  }

  // Check for potentially harmful content
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(comment)) {
      errors.push('Comment contains potentially harmful content');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate screenshot data URL
 */
export function validateScreenshot(screenshot: string): ValidationResult {
  const errors: string[] = [];

  if (typeof screenshot !== 'string') {
    errors.push('Screenshot must be a string');
    return { valid: false, errors };
  }

  if (!screenshot.startsWith('data:image/')) {
    errors.push('Screenshot must be a data URL with image MIME type');
  }

  // Check if it's a reasonable size (not too large)
  const estimatedSize = screenshot.length * 0.75; // Base64 overhead
  const maxSize = 5 * 1024 * 1024; // 5MB limit

  if (estimatedSize > maxSize) {
    errors.push('Screenshot is too large (maximum 5MB)');
  }

  // Validate base64 format
  const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)$/;
  if (!dataUrlPattern.test(screenshot)) {
    errors.push('Screenshot has invalid data URL format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate feedback ID format
 */
export function validateFeedbackId(id: string): ValidationResult {
  const errors: string[] = [];

  if (typeof id !== 'string') {
    errors.push('ID must be a string');
    return { valid: false, errors };
  }

  if (id.trim().length === 0) {
    errors.push('ID cannot be empty');
  }

  if (id.length > 100) {
    errors.push('ID is too long (maximum 100 characters)');
  }

  // Check for valid ID format (alphanumeric, hyphens, underscores)
  const idPattern = /^[a-zA-Z0-9_-]+$/;
  if (!idPattern.test(id)) {
    errors.push('ID contains invalid characters (only alphanumeric, hyphens, and underscores allowed)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Quick validation - returns boolean only
 */
export function isValidFeedback(feedback: Partial<Feedback>): boolean {
  return validateFeedback(feedback).valid;
}

export function isValidDraft(draft: Partial<Draft>): boolean {
  return validateDraft(draft).valid;
}

export function isValidComment(comment: string): boolean {
  return validateComment(comment).valid;
}

export function isValidScreenshot(screenshot: string): boolean {
  return validateScreenshot(screenshot).valid;
}