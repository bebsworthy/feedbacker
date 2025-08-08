/**
 * Component Detection Strategy Chain Pattern
 * Base class and chain management for component detection strategies
 */

import { ComponentInfo } from '../types';

/**
 * Abstract base class for component detection strategies
 */
export abstract class DetectionStrategy {
  protected next?: DetectionStrategy;

  /**
   * Set the next strategy in the chain
   */
  setNext(strategy: DetectionStrategy): DetectionStrategy {
    this.next = strategy;
    return strategy;
  }

  /**
   * Handle component detection - implements chain of responsibility
   */
  handle(element: HTMLElement): ComponentInfo | null {
    const result = this.detect(element);
    if (result) {
      return result;
    }

    if (this.next) {
      return this.next.handle(element);
    }

    return null;
  }

  /**
   * Abstract method for component detection - must be implemented by subclasses
   */
  protected abstract detect(element: HTMLElement): ComponentInfo | null;

  /**
   * Helper method to build component path from React fiber
   */
  protected buildComponentPath(fiber: any): string[] {
    const path: string[] = [];
    let current = fiber;
    const maxDepth = 10; // Limit depth to avoid too long paths
    let depth = 0;

    // Common wrapper components to filter out
    const wrappers = new Set([
      'FeedbackProvider', 'FeedbackErrorBoundary', 'FeedbackProviderInternal',
      'FeedbackContextProvider', 'ComponentDetectionProvider', 'ErrorBoundary',
      'Provider', 'Consumer', 'Context', 'Fragment', 'Suspense', 'StrictMode',
      'App' // Keep App but filter if it's just a wrapper
    ]);

    while (current && depth < maxDepth) {
      if (current.type && typeof current.type === 'function') {
        const componentName = current.type.displayName || current.type.name;
        if (componentName && !wrappers.has(componentName)) {
          // Add to path if it's not a wrapper component
          path.unshift(componentName);
          depth++;
        } else if (componentName === 'App' && path.length === 0) {
          // Only add App if there are no other components yet
          path.unshift(componentName);
          depth++;
        }
      } else if (current.type && typeof current.type === 'string') {
        // Skip HTML elements in the path
      }

      current = current.return;
    }

    // If path is empty, at least show something meaningful
    if (path.length === 0) {
      path.push('Component');
    }

    return path;
  }

  /**
   * Helper method to build hybrid path (Components > HTML elements)
   * Shows React components followed by DOM path to the selected element
   */
  protected buildHybridPath(element: HTMLElement, fiber: any): string[] {
    const path: string[] = [];
    
    // Step 1: Build DOM path from selected element up to nearest React component
    const domPath: string[] = [];
    let currentElement: HTMLElement | null = element;
    let parentComponentFiber: any = null;
    
    // Find the nearest parent React component
    while (currentElement && !parentComponentFiber) {
      // Add current element to DOM path
      const tagName = currentElement.tagName.toLowerCase();
      const className = currentElement.className;
      
      // Format the element (include className for the first/selected element)
      if (domPath.length === 0 && className) {
        // For the selected element, include className
        const classes = className.split(' ').filter(c => c.trim()).join('.');
        domPath.unshift(classes ? `${tagName}.${classes}` : tagName);
      } else {
        domPath.unshift(tagName);
      }
      
      // Check if this element has a React fiber with a component
      const elementFiber = this.getReactFiber(currentElement);
      if (elementFiber) {
        // Walk up the fiber tree to find the nearest React component
        let fiberCurrent = elementFiber;
        while (fiberCurrent) {
          if (fiberCurrent.type && typeof fiberCurrent.type === 'function') {
            const componentName = fiberCurrent.type.displayName || fiberCurrent.type.name;
            if (componentName && this.isValidReactComponent(componentName)) {
              parentComponentFiber = fiberCurrent;
              break;
            }
          }
          fiberCurrent = fiberCurrent.return;
        }
      }
      
      currentElement = currentElement.parentElement;
    }
    
    // Step 2: Build React component path from the parent component upwards
    const componentPath: string[] = [];
    let current = parentComponentFiber;
    const maxDepth = 10;
    let depth = 0;
    
    const wrappers = new Set([
      'FeedbackProvider', 'FeedbackErrorBoundary', 'FeedbackProviderInternal',
      'FeedbackContextProvider', 'ComponentDetectionProvider', 'ErrorBoundary',
      'Provider', 'Consumer', 'Context', 'Fragment', 'Suspense', 'StrictMode'
    ]);
    
    while (current && depth < maxDepth) {
      if (current.type && typeof current.type === 'function') {
        const componentName = current.type.displayName || current.type.name;
        if (componentName && !wrappers.has(componentName)) {
          componentPath.unshift(componentName);
          depth++;
        }
      }
      current = current.return;
    }
    
    // Step 3: Combine paths (Components > DOM elements)
    return [...componentPath, ...domPath];
  }

  /**
   * Check if a name is a valid React component (not a wrapper)
   */
  private isValidReactComponent(name: string): boolean {
    const wrappers = [
      'FeedbackProvider', 'FeedbackErrorBoundary', 'FeedbackProviderInternal',
      'FeedbackContextProvider', 'ComponentDetectionProvider', 'ErrorBoundary',
      'Provider', 'Consumer', 'Context', 'Fragment', 'Suspense', 'StrictMode'
    ];
    
    return !wrappers.includes(name) && 
           !name.includes('Provider') && 
           !name.includes('Context') &&
           name !== 'Anonymous' &&
           name !== 'Component';
  }

  /**
   * Helper method to extract props from React fiber (safely)
   */
  protected extractProps(fiber: any): Record<string, any> | undefined {
    try {
      if (fiber?.memoizedProps) {
        const props = { ...fiber.memoizedProps };
        // Remove children and other internal props for security
        delete props.children;
        delete props.dangerouslySetInnerHTML;
        return props;
      }
    } catch (error) {
      console.warn('[Feedbacker] Error extracting props:', error);
    }
    return undefined;
  }

  /**
   * Helper method to get React fiber from DOM element
   */
  protected getReactFiber(element: HTMLElement): any {
    // React attaches fiber to DOM elements with keys like __reactFiber$ or __reactInternalInstance$
    const fiberKeys = Object.keys(element).filter(key => 
      key.startsWith('__reactFiber') || 
      key.startsWith('__reactInternalInstance')
    );

    if (fiberKeys.length > 0) {
      return (element as any)[fiberKeys[0]];
    }

    return null;
  }

  /**
   * Helper method to sanitize component name
   */
  protected sanitizeComponentName(name: string): string {
    // Remove any potentially unsafe characters and limit length
    return name
      .replace(/[^a-zA-Z0-9_$]/g, '')
      .substring(0, 100);
  }
}

/**
 * Detection Strategy Chain Manager
 * Sets up and manages the chain of detection strategies
 */
export class DetectionChain {
  private firstStrategy?: DetectionStrategy;

  /**
   * Build the complete detection chain
   */
  buildChain(
    devToolsStrategy: DetectionStrategy,
    fiberStrategy: DetectionStrategy,
    heuristicStrategy: DetectionStrategy,
    fallbackStrategy: DetectionStrategy
  ): DetectionStrategy {
    // Set up the chain: DevTools -> Fiber -> Heuristic -> Fallback
    devToolsStrategy
      .setNext(fiberStrategy)
      .setNext(heuristicStrategy)
      .setNext(fallbackStrategy);

    this.firstStrategy = devToolsStrategy;
    return this.firstStrategy;
  }

  /**
   * Detect component using the complete strategy chain
   */
  detectComponent(element: HTMLElement): ComponentInfo | null {
    if (!this.firstStrategy) {
      throw new Error('Detection chain not built. Call buildChain() first.');
    }

    try {
      return this.firstStrategy.handle(element);
    } catch (error) {
      console.error('[Feedbacker] Component detection error:', error);
      return null;
    }
  }
}