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
      // Build a hybrid-style path even without fiber data
      const path = this.buildHeuristicHybridPath(element);
      
      // Extract component name from the path or guess it
      const componentName = this.extractComponentFromPath(path) || 
                           this.guessComponentName(element) || 
                           'Component';

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
   * Build a hybrid-style path using heuristics (no fiber data)
   */
  private buildHeuristicHybridPath(element: HTMLElement): string[] {
    const path: string[] = [];
    const domPath: string[] = [];
    const componentPath: string[] = [];
    
    let currentElement: HTMLElement | null = element;
    let foundComponent = false;
    let depth = 0;
    const maxDepth = 10;
    
    // Step 1: Build path from element upwards, trying to identify components
    while (currentElement && depth < maxDepth) {
      const tagName = currentElement.tagName.toLowerCase();
      const className = currentElement.className;
      
      // Try to identify if this might be a React component
      const possibleComponentName = this.guessComponentName(currentElement);
      
      if (possibleComponentName && !foundComponent) {
        // Found a likely component - switch to component path
        foundComponent = true;
        componentPath.unshift(possibleComponentName);
      } else if (!foundComponent) {
        // Still in DOM elements
        if (domPath.length === 0 && className) {
          // For the selected element, include className
          const classes = className.split(' ').filter(c => c.trim()).join('.');
          domPath.unshift(classes ? `${tagName}.${classes}` : tagName);
        } else {
          domPath.unshift(tagName);
        }
      } else {
        // We're above the first component, look for parent components
        const parentComponentName = this.guessComponentName(currentElement);
        if (parentComponentName) {
          componentPath.unshift(parentComponentName);
        }
      }
      
      currentElement = currentElement.parentElement;
      depth++;
    }
    
    // If we didn't find any components, treat the whole thing as DOM path
    if (componentPath.length === 0 && domPath.length > 0) {
      // Try to infer a component from the context
      const inferredComponent = 'Component';
      componentPath.push(inferredComponent);
    }
    
    // Combine paths
    return [...componentPath, ...domPath];
  }

  /**
   * Extract component name from path
   */
  private extractComponentFromPath(path: string[]): string | null {
    for (let i = path.length - 1; i >= 0; i--) {
      const segment = path[i];
      if (!segment) continue;
      // Check if it's not an HTML element
      if (!/^[a-z]/.test(segment) && !segment.includes('.')) {
        return segment;
      }
    }
    return null;
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