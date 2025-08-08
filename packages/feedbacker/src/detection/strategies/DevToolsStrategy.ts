/**
 * DevToolsStrategy - Uses React DevTools hook for component detection
 * This is the most reliable method when DevTools are available
 */

import { DetectionStrategy } from '../DetectionStrategy';
import { ComponentInfo } from '../../types';

export class DevToolsStrategy extends DetectionStrategy {
  private reactDevTools: any = null;

  constructor() {
    super();
    this.initializeDevTools();
  }

  /**
   * Initialize React DevTools hook if available
   */
  private initializeDevTools(): void {
    try {
      // Check for React DevTools hook
      if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        this.reactDevTools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      }
    } catch (error) {
      console.warn('[Feedbacker] DevTools not available:', error);
    }
  }

  /**
   * Detect component using React DevTools hook
   */
  protected detect(element: HTMLElement): ComponentInfo | null {
    if (!this.reactDevTools) {
      return null;
    }

    try {
      // Try to get the React fiber through DevTools
      const fiber = this.getDevToolsFiber(element);
      
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
      console.warn('[Feedbacker] DevTools detection failed:', error);
      return null;
    }
  }

  /**
   * Get React fiber using DevTools hook
   */
  private getDevToolsFiber(element: HTMLElement): any {
    if (!this.reactDevTools) {
      return null;
    }

    try {
      // DevTools provides a findFiberByHostInstance method
      if (this.reactDevTools.findFiberByHostInstance) {
        return this.reactDevTools.findFiberByHostInstance(element);
      }

      // Fallback to checking renderers
      if (this.reactDevTools.renderers && this.reactDevTools.renderers.size > 0) {
        for (const renderer of this.reactDevTools.renderers.values()) {
          if (renderer.findFiberByHostInstance) {
            const fiber = renderer.findFiberByHostInstance(element);
            if (fiber) return fiber;
          }
        }
      }

    } catch (error) {
      console.warn('[Feedbacker] DevTools fiber lookup failed:', error);
    }

    return null;
  }

  /**
   * Extract component name from React fiber
   */
  private getComponentNameFromFiber(fiber: any): string | null {
    if (!fiber) return null;

    try {
      // Check for function components
      if (fiber.type && typeof fiber.type === 'function') {
        return fiber.type.displayName || fiber.type.name || null;
      }

      // Check for class components
      if (fiber.stateNode && fiber.stateNode.constructor) {
        return fiber.stateNode.constructor.displayName || 
               fiber.stateNode.constructor.name || 
               null;
      }

      // Check for forwardRef components
      if (fiber.type && fiber.type.$$typeof) {
        const typeString = fiber.type.$$typeof.toString();
        if (typeString.includes('react.forward_ref') && fiber.type.render) {
          return fiber.type.render.displayName || 
                 fiber.type.render.name || 
                 'ForwardRef';
        }
        
        if (typeString.includes('react.memo') && fiber.type.type) {
          return fiber.type.type.displayName || 
                 fiber.type.type.name || 
                 'Memo';
        }
      }

    } catch (error) {
      console.warn('[Feedbacker] Error extracting component name:', error);
    }

    return null;
  }
}