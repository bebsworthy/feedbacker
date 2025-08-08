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

    while (current) {
      if (current.type && typeof current.type === 'function') {
        const componentName = current.type.displayName || current.type.name;
        if (componentName) {
          path.unshift(componentName);
        }
      } else if (current.type && typeof current.type === 'string') {
        // Skip HTML elements in the path
      }

      current = current.return;
    }

    return path;
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