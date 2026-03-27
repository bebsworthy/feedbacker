/**
 * DetectionController - Plain TypeScript port of useComponentDetection
 * Manages component detection state and DOM event listeners
 */

import type { ComponentInfo } from '@feedbacker/detection';
import { createDetector, throttle } from '@feedbacker/detection';
import { logger } from '@feedbacker/core';

const MESSAGE_PREFIX = 'feedbacker-detection';

export class DetectionController {
  private detector = createDetector();
  private _isActive = false;
  private _hoveredComponent: ComponentInfo | null = null;
  private _selectedComponent: ComponentInfo | null = null;

  private onHover: ((info: ComponentInfo | null) => void) | null = null;
  private onSelect: ((info: ComponentInfo) => void) | null = null;
  private onActivate: (() => void) | null = null;
  private onDeactivate: (() => void) | null = null;

  private throttledMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundClick: ((e: MouseEvent) => void) | null = null;
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private boundMessage: ((e: MessageEvent) => void) | null = null;

  get isActive(): boolean {
    return this._isActive;
  }

  get hoveredComponent(): ComponentInfo | null {
    return this._hoveredComponent;
  }

  get selectedComponent(): ComponentInfo | null {
    return this._selectedComponent;
  }

  setCallbacks(
    onHover: (info: ComponentInfo | null) => void,
    onSelect: (info: ComponentInfo) => void
  ): void {
    this.onHover = onHover;
    this.onSelect = onSelect;
  }

  setLifecycleCallbacks(
    onActivate: () => void,
    onDeactivate: () => void
  ): void {
    this.onActivate = onActivate;
    this.onDeactivate = onDeactivate;
  }

  activate(): void {
    if (this._isActive) return;
    this._isActive = true;
    this._selectedComponent = null;
    this._hoveredComponent = null;

    // Inject detection bridge for React fiber access
    this.injectDetectionBridge();

    this.throttledMouseMove = throttle((e: MouseEvent) => {
      this.handleMouseMove(e);
    }, 16); // ~60fps

    this.boundClick = (e: MouseEvent) => {
      this.handleClick(e);
    };

    this.boundKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.deactivate();
      }
    };

    this.boundMessage = (e: MessageEvent) => {
      if (e.data?.type === `${MESSAGE_PREFIX}:result`) {
        this.handleBridgeResult(e.data);
      }
    };

    document.addEventListener('mousemove', this.throttledMouseMove, true);
    document.addEventListener('click', this.boundClick, true);
    document.addEventListener('keydown', this.boundKeydown, true);
    window.addEventListener('message', this.boundMessage);

    document.body.style.cursor = 'crosshair';
    logger.debug('Detection activated');
    this.onActivate?.();
  }

  deactivate(): void {
    if (!this._isActive) return;
    this._isActive = false;
    this._hoveredComponent = null;

    if (this.throttledMouseMove) {
      document.removeEventListener('mousemove', this.throttledMouseMove, true);
    }
    if (this.boundClick) {
      document.removeEventListener('click', this.boundClick, true);
    }
    if (this.boundKeydown) {
      document.removeEventListener('keydown', this.boundKeydown, true);
    }
    if (this.boundMessage) {
      window.removeEventListener('message', this.boundMessage);
    }

    document.body.style.cursor = '';
    this.onHover?.(null);
    logger.debug('Detection deactivated');
    this.onDeactivate?.();
  }

  destroy(): void {
    this.deactivate();
    this.onHover = null;
    this.onSelect = null;
    this.onActivate = null;
    this.onDeactivate = null;
  }

  private handleMouseMove(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target || this.isExtensionElement(target)) {
      this._hoveredComponent = null;
      this.onHover?.(null);
      return;
    }

    const info = this.detector.detectComponent(target);
    this._hoveredComponent = info;
    this.onHover?.(info);
  }

  private handleClick(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const target = e.target as HTMLElement;
    if (!target || this.isExtensionElement(target)) return;

    const info = this.detector.detectComponent(target);
    if (info) {
      this._selectedComponent = info;
      this.onSelect?.(info);
      this.deactivate();
    }
  }

  private isExtensionElement(el: HTMLElement): boolean {
    // Check if element is part of our shadow DOM host or overlay
    if (el.id === 'feedbacker-overlay' || el.id === 'feedbacker-extension-root') {
      return true;
    }
    let node: Node | null = el;
    while (node) {
      if (node instanceof HTMLElement) {
        if (node.id === 'feedbacker-extension-root' || node.id === 'feedbacker-overlay') {
          return true;
        }
      }
      node = node.parentNode;
    }
    return false;
  }

  private injectDetectionBridge(): void {
    // Request the background to inject the detection bridge into MAIN world
    try {
      chrome.runtime.sendMessage({ type: 'inject-detection-bridge' });
    } catch (error) {
      // Content script context might not have chrome.runtime in some edge cases
      logger.debug('Could not request detection bridge injection:', error);
    }
  }

  private handleBridgeResult(data: any): void {
    // The detection bridge in MAIN world can send enhanced component info
    // that includes React fiber data not accessible from the content script
    if (data.componentInfo && this._hoveredComponent) {
      // Merge bridge results with our detection results
      if (data.componentInfo.name && data.componentInfo.name !== 'Unknown') {
        this._hoveredComponent = {
          ...this._hoveredComponent,
          name: data.componentInfo.name,
          path: data.componentInfo.path || this._hoveredComponent.path
        };
        this.onHover?.(this._hoveredComponent);
      }
    }
  }
}
