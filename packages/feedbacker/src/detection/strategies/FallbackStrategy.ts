/**
 * FallbackStrategy - Final fallback for component detection
 * Always returns "Unknown Component" with basic element information
 */

import { DetectionStrategy } from '../DetectionStrategy';
import { ComponentInfo } from '../../types';

export class FallbackStrategy extends DetectionStrategy {
  
  /**
   * Always detect with fallback information - never returns null
   */
  protected detect(element: HTMLElement): ComponentInfo | null {
    try {
      const tagName = element.tagName.toLowerCase();
      const id = element.id;
      const className = element.className;

      // Create a descriptive fallback name
      const fallbackName = this.createFallbackName(element);
      
      // Create a simple path with DOM hierarchy
      const path = this.createFallbackPath(element);

      // Extract basic element information as "props"
      const elementInfo = this.extractElementInfo(element);

      return {
        name: fallbackName,
        path,
        element,
        props: elementInfo,
        fiber: undefined
      };

    } catch (error) {
      console.warn('[Feedbacker] Fallback detection failed:', error);
      
      // Even if there's an error, return basic fallback
      return {
        name: 'Unknown Component',
        path: ['Unknown Component'],
        element,
        props: { tagName: element.tagName.toLowerCase() },
        fiber: undefined
      };
    }
  }

  /**
   * Create a descriptive fallback name based on element characteristics
   */
  private createFallbackName(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id;
    const classList = Array.from(element.classList);

    // Try to create a more specific name based on available information
    if (id) {
      return `Unknown Component (${tagName}#${id})`;
    }

    // Look for meaningful class names
    const meaningfulClass = classList.find(cls => 
      cls.length > 2 && 
      !cls.match(/^(w-|h-|p-|m-|bg-|text-|flex|grid|hidden|absolute|relative)/) &&
      cls.match(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
    );

    if (meaningfulClass) {
      return `Unknown Component (${tagName}.${meaningfulClass})`;
    }

    // Check for semantic meaning from content or attributes
    const semanticName = this.getSemanticName(element);
    if (semanticName) {
      return `Unknown Component (${semanticName})`;
    }

    // Default fallback
    return 'Unknown Component';
  }

  /**
   * Create a simple fallback path with DOM hierarchy
   */
  private createFallbackPath(element: HTMLElement): string[] {
    const path: string[] = [];
    let current = element;
    let depth = 0;
    const maxDepth = 5;

    while (current && current !== document.body && depth < maxDepth) {
      const tagName = current.tagName.toLowerCase();
      const id = current.id;
      const classList = Array.from(current.classList);

      let pathSegment = tagName;

      if (id) {
        pathSegment = `${tagName}#${id}`;
      } else if (classList.length > 0) {
        const mainClass = classList[0];
        pathSegment = `${tagName}.${mainClass}`;
      }

      path.unshift(this.capitalizeFirst(pathSegment));
      current = current.parentElement;
      depth++;
    }

    // Ensure the path always ends with our component
    if (path.length === 0 || path[path.length - 1] !== 'Unknown Component') {
      path.push('Unknown Component');
    }

    return path;
  }

  /**
   * Extract basic element information
   */
  private extractElementInfo(element: HTMLElement): Record<string, any> {
    const info: Record<string, any> = {
      tagName: element.tagName.toLowerCase()
    };

    // Add ID if present
    if (element.id) {
      info.id = element.id;
    }

    // Add classes if present (limit to first few to avoid bloat)
    const classList = Array.from(element.classList).slice(0, 5);
    if (classList.length > 0) {
      info.className = classList.join(' ');
    }

    // Add role if present
    const role = element.getAttribute('role');
    if (role) {
      info.role = role;
    }

    // Add data attributes that might be relevant
    const dataAttributes: Record<string, string> = {};
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-') && attr.value) {
        const key = attr.name.replace('data-', '');
        if (key.length < 50 && attr.value.length < 100) {
          dataAttributes[key] = attr.value;
        }
      }
    }

    if (Object.keys(dataAttributes).length > 0) {
      info.dataAttributes = dataAttributes;
    }

    // Add text content if it's short and meaningful
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length > 0 && textContent.length < 100) {
      info.textContent = textContent.substring(0, 50);
    }

    return info;
  }

  /**
   * Get semantic name from element characteristics
   */
  private getSemanticName(element: HTMLElement): string | null {
    // Check for ARIA labels
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.length < 30) {
      return `labeled "${ariaLabel}"`;
    }

    // Check for button text
    if (element.tagName.toLowerCase() === 'button') {
      const buttonText = element.textContent?.trim();
      if (buttonText && buttonText.length < 20) {
        return `button "${buttonText}"`;
      }
    }

    // Check for input placeholders
    if (element.tagName.toLowerCase() === 'input') {
      const placeholder = element.getAttribute('placeholder');
      if (placeholder && placeholder.length < 30) {
        return `input "${placeholder}"`;
      }
    }

    // Check for link text
    if (element.tagName.toLowerCase() === 'a') {
      const linkText = element.textContent?.trim();
      if (linkText && linkText.length < 20) {
        return `link "${linkText}"`;
      }
    }

    return null;
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}