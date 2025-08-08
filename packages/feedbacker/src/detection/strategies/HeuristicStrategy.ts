/**
 * HeuristicStrategy - DOM-based heuristic analysis for component detection
 * Used when React fiber information is not available
 */

import { DetectionStrategy } from '../DetectionStrategy';
import { ComponentInfo } from '../../types';

export class HeuristicStrategy extends DetectionStrategy {
  
  /**
   * Detect component using DOM heuristics
   */
  protected detect(element: HTMLElement): ComponentInfo | null {
    try {
      const componentName = this.guessComponentName(element);
      
      if (!componentName) {
        return null;
      }

      // Build a simple path based on DOM structure
      const path = this.buildDOMPath(element);

      return {
        name: this.sanitizeComponentName(componentName),
        path,
        element,
        props: undefined, // No props available in heuristic mode
        fiber: undefined
      };

    } catch (error) {
      console.warn('[Feedbacker] Heuristic detection failed:', error);
      return null;
    }
  }

  /**
   * Guess component name from DOM element using various heuristics
   */
  private guessComponentName(element: HTMLElement): string | null {
    // Strategy 1: Look for data attributes that might indicate component names
    const componentName = this.checkDataAttributes(element);
    if (componentName) return componentName;

    // Strategy 2: Look for CSS class names that might be component names
    const className = this.guessFromClassName(element);
    if (className) return className;

    // Strategy 3: Look for semantic HTML elements that might represent components
    const semanticName = this.guessFromSemanticHTML(element);
    if (semanticName) return semanticName;

    // Strategy 4: Look at parent elements for context
    const contextualName = this.guessFromContext(element);
    if (contextualName) return contextualName;

    return null;
  }

  /**
   * Check data attributes for component hints
   */
  private checkDataAttributes(element: HTMLElement): string | null {
    // Common data attributes used by React developers
    const possibleAttributes = [
      'data-component',
      'data-component-name',
      'data-react-component',
      'data-testid',
      'data-cy', // Cypress testing
      'data-test' // General testing
    ];

    for (const attr of possibleAttributes) {
      const value = element.getAttribute(attr);
      if (value && this.isValidComponentName(value)) {
        return this.formatComponentName(value);
      }
    }

    return null;
  }

  /**
   * Guess component name from CSS class names
   */
  private guessFromClassName(element: HTMLElement): string | null {
    const classList = Array.from(element.classList);
    
    for (const className of classList) {
      // Look for component-like class names (PascalCase or component-style)
      if (this.looksLikeComponentClass(className)) {
        return this.formatComponentName(className);
      }
    }

    return null;
  }

  /**
   * Check if a class name looks like a React component class
   */
  private looksLikeComponentClass(className: string): boolean {
    // Skip common utility classes
    const skipPatterns = [
      /^(bg-|text-|p-|m-|w-|h-|flex|grid|hidden|visible)/i, // Tailwind-like
      /^(btn|card|nav|header|footer|main|content)/i, // Common UI classes
      /^(active|disabled|selected|hover|focus)/i, // State classes
      /^[a-z]/  // Skip lowercase-first classes (likely utility classes)
    ];

    for (const pattern of skipPatterns) {
      if (pattern.test(className)) {
        return false;
      }
    }

    // Look for PascalCase or component-style names
    return (
      /^[A-Z][a-zA-Z0-9]*$/.test(className) || // PascalCase
      /^[A-Z][a-zA-Z0-9]*-[A-Z][a-zA-Z0-9]*$/.test(className) || // Component-SubComponent
      className.includes('Component') ||
      className.includes('Widget') ||
      className.includes('Module')
    );
  }

  /**
   * Guess component name from semantic HTML elements
   */
  private guessFromSemanticHTML(element: HTMLElement): string | null {
    const tagName = element.tagName.toLowerCase();

    // Map semantic HTML to likely component names
    const semanticMap: Record<string, string> = {
      'header': 'Header',
      'nav': 'Navigation',
      'main': 'MainContent',
      'aside': 'Sidebar',
      'footer': 'Footer',
      'article': 'Article',
      'section': 'Section',
      'form': 'Form',
      'table': 'Table',
      'dialog': 'Modal',
      'details': 'Accordion'
    };

    if (semanticMap[tagName]) {
      return semanticMap[tagName];
    }

    // Check for role attributes
    const role = element.getAttribute('role');
    if (role) {
      const roleMap: Record<string, string> = {
        'button': 'Button',
        'dialog': 'Modal',
        'tabpanel': 'TabPanel',
        'tab': 'Tab',
        'tablist': 'TabList',
        'menu': 'Menu',
        'menuitem': 'MenuItem',
        'tooltip': 'Tooltip',
        'alert': 'Alert'
      };

      if (roleMap[role]) {
        return roleMap[role];
      }
    }

    return null;
  }

  /**
   * Guess component name from context (parent elements)
   */
  private guessFromContext(element: HTMLElement): string | null {
    let parent = element.parentElement;
    let depth = 0;
    const maxDepth = 3;

    while (parent && depth < maxDepth) {
      // Check parent's data attributes or class names
      const parentName = this.checkDataAttributes(parent) || this.guessFromClassName(parent);
      
      if (parentName) {
        // Create a contextual name
        const tagName = element.tagName.toLowerCase();
        return `${parentName}${this.capitalizeFirst(tagName)}`;
      }

      parent = parent.parentElement;
      depth++;
    }

    return null;
  }

  /**
   * Build a simple DOM-based path
   */
  private buildDOMPath(element: HTMLElement): string[] {
    const path: string[] = [];
    let current = element;
    let depth = 0;
    const maxDepth = 10;

    while (current && current !== document.body && depth < maxDepth) {
      const name = this.guessComponentName(current) || current.tagName.toLowerCase();
      path.unshift(this.formatComponentName(name));
      current = current.parentElement;
      depth++;
    }

    return path;
  }

  /**
   * Format component name consistently
   */
  private formatComponentName(name: string): string {
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => this.capitalizeFirst(word))
      .join('');
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Check if a string could be a valid component name
   */
  private isValidComponentName(name: string): boolean {
    return (
      name.length > 0 &&
      name.length < 50 &&
      /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name) &&
      !['div', 'span', 'p', 'a', 'img', 'button'].includes(name.toLowerCase())
    );
  }
}