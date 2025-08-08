/**
 * FiberStrategy - Direct React fiber inspection for component detection
 * Used when DevTools are not available but React fiber data is accessible
 */

import { DetectionStrategy } from '../DetectionStrategy';
import { ComponentInfo } from '../../types';

export class FiberStrategy extends DetectionStrategy {
  
  /**
   * Detect component by directly inspecting React fiber
   */
  protected detect(element: HTMLElement): ComponentInfo | null {
    try {
      const fiber = this.getReactFiber(element);
      
      if (!fiber) {
        return null;
      }

      // Use hybrid path instead of component-only path
      const path = this.buildHybridPath(element, fiber);
      
      // Extract the component name from the path or fiber
      const componentName = this.extractComponentNameFromPath(path) || 
                           this.getComponentNameFromFiber(fiber) ||
                           'Component';
      
      const props = this.extractProps(fiber);

      return {
        name: this.sanitizeComponentName(componentName),
        path,
        element,
        props,
        fiber
      };

    } catch (error) {
      console.warn('[Feedbacker] Fiber detection failed:', error);
      return null;
    }
  }

  /**
   * Extract component name from hybrid path
   */
  private extractComponentNameFromPath(path: string[]): string | null {
    // Find the last React component in the path (before HTML elements)
    for (let i = path.length - 1; i >= 0; i--) {
      const segment = path[i];
      if (!segment) continue;
      // Check if it's an HTML element (lowercase or contains .)
      if (!/^[a-z]/.test(segment) && !segment.includes('.')) {
        return segment;
      }
    }
    return null;
  }

  /**
   * Extract component name from React fiber
   */
  private getComponentNameFromFiber(fiber: any): string | null {
    if (!fiber) return null;

    try {
      // First try to get the name from the immediate fiber
      const immediateName = this.extractNameFromFiber(fiber);
      if (immediateName && this.isValidComponentName(immediateName)) {
        return immediateName;
      }

      // Walk up the fiber tree to find a named component
      let current = fiber.return; // Start from parent
      let attempts = 0;
      const maxAttempts = 20; // Prevent infinite loops

      while (current && attempts < maxAttempts) {
        const name = this.extractNameFromFiber(current);
        if (name && this.isValidComponentName(name)) {
          return name;
        }
        current = current.return;
        attempts++;
      }

    } catch (error) {
      console.warn('[Feedbacker] Error walking fiber tree:', error);
    }

    return null;
  }

  /**
   * Check if component name is valid and not a wrapper
   */
  private isValidComponentName(name: string): boolean {
    // Filter out common wrapper/provider components
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
   * Extract name from a single fiber node
   */
  private extractNameFromFiber(fiber: any): string | null {
    if (!fiber) return null;

    try {
      // Function components
      if (fiber.type && typeof fiber.type === 'function') {
        const name = fiber.type.displayName || fiber.type.name;
        if (name && name !== 'Anonymous') {
          return name;
        }
      }

      // Class components
      if (fiber.stateNode && fiber.stateNode.constructor) {
        const name = fiber.stateNode.constructor.displayName || 
                    fiber.stateNode.constructor.name;
        if (name && name !== 'Object') {
          return name;
        }
      }

      // Handle special React types
      if (fiber.type && fiber.type.$$typeof) {
        return this.handleSpecialReactTypes(fiber);
      }

      // Memoized components
      if (fiber.elementType && typeof fiber.elementType === 'function') {
        const name = fiber.elementType.displayName || fiber.elementType.name;
        if (name && name !== 'Anonymous') {
          return name;
        }
      }

    } catch (error) {
      console.warn('[Feedbacker] Error extracting fiber name:', error);
    }

    return null;
  }

  /**
   * Handle special React component types (forwardRef, memo, etc.)
   */
  private handleSpecialReactTypes(fiber: any): string | null {
    if (!fiber.type?.$$typeof) return null;

    try {
      const symbolString = fiber.type.$$typeof.toString();

      // React.forwardRef
      if (symbolString.includes('react.forward_ref')) {
        if (fiber.type.render) {
          const name = fiber.type.render.displayName || fiber.type.render.name;
          return name ? `ForwardRef(${name})` : 'ForwardRef';
        }
        return 'ForwardRef';
      }

      // React.memo
      if (symbolString.includes('react.memo')) {
        if (fiber.type.type) {
          const name = fiber.type.type.displayName || fiber.type.type.name;
          return name ? `Memo(${name})` : 'Memo';
        }
        return 'Memo';
      }

      // React.lazy
      if (symbolString.includes('react.lazy')) {
        return 'Lazy';
      }

      // React.Suspense
      if (symbolString.includes('react.suspense')) {
        return 'Suspense';
      }

      // React.Fragment
      if (symbolString.includes('react.fragment')) {
        return 'Fragment';
      }

      // React.Context.Provider
      if (symbolString.includes('react.provider')) {
        return 'ContextProvider';
      }

      // React.Context.Consumer
      if (symbolString.includes('react.consumer')) {
        return 'ContextConsumer';
      }

    } catch (error) {
      console.warn('[Feedbacker] Error handling special React types:', error);
    }

    return null;
  }
}