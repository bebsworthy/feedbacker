/**
 * FallbackStrategy - Final fallback for component detection
 * Always returns "Unknown Component" with basic element information
 */

import { DetectionStrategy } from '../DetectionStrategy';
import { ComponentInfo } from '../../types';
import logger from '../../utils/logger';

export class FallbackStrategy extends DetectionStrategy {
  /**
   * Always detect with fallback information - never returns null
   */
  protected detect(element: HTMLElement): ComponentInfo | null {
    try {
      // Create a hybrid-style fallback path
      const path = this.createHybridFallbackPath(element);

      // Create a descriptive fallback name based on the element
      const fallbackName = this.createFallbackName(element);

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
      logger.warn('Fallback detection failed:', error);

      // Even if there's an error, return basic fallback
      const tagName = element.tagName.toLowerCase();
      const className = element.className;
      const fallbackPath = className
        ? ['Unknown', `${tagName}.${className.split(' ').join('.')}`]
        : ['Unknown', tagName];

      return {
        name: 'Unknown Component',
        path: fallbackPath,
        element,
        props: { tagName },
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
    const meaningfulClass = classList.find(
      (cls) =>
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
   * Create a hybrid-style fallback path with inferred component and DOM hierarchy
   */
  private createHybridFallbackPath(element: HTMLElement): string[] {
    const domPath: string[] = [];
    const componentPath: string[] = ['Unknown']; // Default component name

    let current: HTMLElement | null = element;
    let depth = 0;
    const maxDepth = 5;

    // Build DOM path from selected element upwards
    while (current && current !== document.body && depth < maxDepth) {
      const tagName = current.tagName.toLowerCase();
      const id = current.id;
      const classList = Array.from(current.classList);

      // For the first element (selected), include all classes
      if (depth === 0 && classList.length > 0) {
        const classes = classList.filter((c) => c.trim()).join('.');
        domPath.unshift(`${tagName}.${classes}`);
      } else if (depth === 0 && id) {
        domPath.unshift(`${tagName}#${id}`);
      } else {
        // For parent elements, just show tag name
        domPath.unshift(tagName);
      }

      // Try to detect if we've reached a component boundary
      // Look for semantic indicators that might suggest a component
      if (this.looksLikeComponent(current) && componentPath.length === 1) {
        // Replace 'Unknown' with a better guess
        const componentName = this.inferComponentName(current);
        if (componentName) {
          componentPath[0] = componentName;
        }
      }

      current = current.parentElement;
      depth++;
    }

    // Combine paths (component > DOM elements)
    return [...componentPath, ...domPath];
  }

  /**
   * Check if element looks like it might be a component root
   */
  private looksLikeComponent(element: HTMLElement): boolean {
    // Check for data attributes that might indicate a component
    if (
      element.hasAttribute('data-component') ||
      element.hasAttribute('data-testid') ||
      element.hasAttribute('data-react-component')
    ) {
      return true;
    }

    // Check for semantic HTML that might be component roots
    const semanticTags = ['article', 'section', 'aside', 'header', 'footer', 'main', 'nav'];
    if (semanticTags.includes(element.tagName.toLowerCase())) {
      return true;
    }

    // Check for class patterns that suggest components
    const classList = Array.from(element.classList);
    return classList.some(
      (cls) =>
        /^[A-Z]/.test(cls) || // PascalCase
        cls.includes('component') ||
        cls.includes('widget') ||
        cls.includes('module')
    );
  }

  /**
   * Infer a component name from element characteristics
   */
  private inferComponentName(element: HTMLElement): string | null {
    // Check data attributes
    const dataComponent = element.getAttribute('data-component');
    if (dataComponent) {
      return dataComponent;
    }

    const dataTestId = element.getAttribute('data-testid');
    if (dataTestId) {
      return this.formatComponentName(dataTestId);
    }

    // Check for PascalCase classes
    const classList = Array.from(element.classList);
    const pascalClass = classList.find((cls) => /^[A-Z][a-zA-Z0-9]*$/.test(cls));
    if (pascalClass) {
      return pascalClass;
    }

    // Use semantic HTML element names
    const tagName = element.tagName.toLowerCase();
    const semanticNames: Record<string, string> = {
      header: 'Header',
      nav: 'Navigation',
      main: 'Main',
      aside: 'Sidebar',
      footer: 'Footer',
      article: 'Article',
      section: 'Section'
    };

    if (semanticNames[tagName]) {
      return semanticNames[tagName];
    }

    return null;
  }

  /**
   * Format a string as a component name
   */
  private formatComponentName(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map((word) => this.capitalizeFirst(word))
      .join('');
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
