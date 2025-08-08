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

      const componentName = this.getComponentNameFromFiber(fiber);
      
      if (!componentName) {
        return null;
      }

      const path = this.buildComponentPath(fiber);
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
   * Extract component name from React fiber
   */
  private getComponentNameFromFiber(fiber: any): string | null {
    if (!fiber) return null;

    try {
      // Walk up the fiber tree to find a named component
      let current = fiber;
      let attempts = 0;
      const maxAttempts = 20; // Prevent infinite loops

      while (current && attempts < maxAttempts) {
        const name = this.extractNameFromFiber(current);
        if (name) {
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