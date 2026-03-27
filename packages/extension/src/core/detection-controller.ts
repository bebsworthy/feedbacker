/**
 * DetectionController - Plain TypeScript port of useComponentDetection
 * Manages component detection state and DOM event listeners
 */

import type { ComponentInfo } from '@feedbacker/detection';
import { createDetector, throttle, getHumanReadableName } from '@feedbacker/detection';
import { logger } from '@feedbacker/core';

const MESSAGE_PREFIX = 'feedbacker-detection';

/** Tag names that should be skipped during DOM hierarchy navigation */
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE']);

/** Selector for elements reachable via Tab key */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export class DetectionController {
  private detector = createDetector();
  private _isActive = false;
  private _hoveredComponent: ComponentInfo | null = null;
  private _selectedComponent: ComponentInfo | null = null;
  private _currentElement: HTMLElement | null = null;
  private _focusableIndex = -1;
  private _ariaLiveRegion: HTMLElement | null = null;

  private onHover: ((info: ComponentInfo | null) => void) | null = null;
  private onSelect: ((info: ComponentInfo) => void) | null = null;
  private onActivate: (() => void) | null = null;
  private onDeactivate: (() => void) | null = null;

  private throttledMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundClick: ((e: MouseEvent) => void) | null = null;
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private boundMessage: ((e: MessageEvent) => void) | null = null;
  private boundWheel: ((e: WheelEvent) => void) | null = null;

  get isActive(): boolean {
    return this._isActive;
  }

  get hoveredComponent(): ComponentInfo | null {
    return this._hoveredComponent;
  }

  get selectedComponent(): ComponentInfo | null {
    return this._selectedComponent;
  }

  get currentElement(): HTMLElement | null {
    return this._currentElement;
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
      this.handleKeydown(e);
    };

    this.createAriaLiveRegion();

    this.boundMessage = (e: MessageEvent) => {
      if (e.data?.type === `${MESSAGE_PREFIX}:result`) {
        this.handleBridgeResult(e.data);
      }
    };

    this.boundWheel = (e: WheelEvent) => {
      this.handleWheel(e);
    };

    document.addEventListener('mousemove', this.throttledMouseMove, true);
    document.addEventListener('click', this.boundClick, true);
    document.addEventListener('keydown', this.boundKeydown, true);
    window.addEventListener('message', this.boundMessage);
    document.addEventListener('wheel', this.boundWheel, { capture: true, passive: false });

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
    if (this.boundWheel) {
      document.removeEventListener('wheel', this.boundWheel, true);
    }

    this._currentElement = null;
    this._focusableIndex = -1;
    this.removeAriaLiveRegion();
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

  /** Set the current element for DOM hierarchy navigation */
  setCurrentElement(element: HTMLElement): void {
    this._currentElement = element;
    const info = this.detector.detectComponent(element);
    this._hoveredComponent = info;
    this.onHover?.(info);
    const name = info ? getHumanReadableName(element, info.name) : element.tagName.toLowerCase();
    this.announceToLiveRegion(`Highlighting: ${name}`);
    logger.debug(`DOM navigation: set current to <${element.tagName.toLowerCase()}>`);
  }

  /** Navigate to the parent element, skipping non-navigable elements */
  navigateToParent(): HTMLElement | null {
    if (!this._currentElement) return null;

    let candidate = this._currentElement.parentElement;
    while (candidate) {
      if (this.isNavigableElement(candidate)) {
        this.setCurrentElement(candidate);
        return candidate;
      }
      candidate = candidate.parentElement;
    }
    return null;
  }

  /** Navigate to the first navigable child element */
  navigateToChild(): HTMLElement | null {
    if (!this._currentElement) return null;

    const children = this._currentElement.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child instanceof HTMLElement && this.isNavigableElement(child)) {
        this.setCurrentElement(child);
        return child;
      }
    }
    return null;
  }

  /** Navigate to the next or previous sibling, skipping non-navigable elements */
  navigateToSibling(direction: 'next' | 'previous'): HTMLElement | null {
    if (!this._currentElement) return null;

    const prop = direction === 'next' ? 'nextElementSibling' : 'previousElementSibling';
    let candidate = this._currentElement[prop];
    while (candidate) {
      if (candidate instanceof HTMLElement && this.isNavigableElement(candidate)) {
        this.setCurrentElement(candidate);
        return candidate;
      }
      candidate = candidate[prop];
    }
    return null;
  }

  /** Check if an element is suitable for navigation (not script/style/extension) */
  private isNavigableElement(el: HTMLElement): boolean {
    if (SKIP_TAGS.has(el.tagName)) return false;
    if (this.isExtensionElement(el)) return false;
    // Stop at document element (html) — it is navigable but its parent is not
    return true;
  }

  /** Get all focusable elements on the page, excluding extension elements */
  getFocusableElements(): HTMLElement[] {
    const all = document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const result: HTMLElement[] = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (!this.isExtensionElement(el)) {
        result.push(el);
      }
    }
    return result;
  }

  /** Navigate to the next or previous focusable element (Tab / Shift+Tab) */
  navigateToFocusable(direction: 'next' | 'previous'): HTMLElement | null {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      this.announceToLiveRegion(
        'No focusable elements found. Use arrow keys to navigate.'
      );
      return null;
    }

    if (direction === 'next') {
      this._focusableIndex = (this._focusableIndex + 1) % focusable.length;
    } else {
      this._focusableIndex =
        this._focusableIndex <= 0
          ? focusable.length - 1
          : this._focusableIndex - 1;
    }

    const target = focusable[this._focusableIndex];
    this.setCurrentElement(target);
    logger.debug(
      `Keyboard selection: Tab to <${target.tagName.toLowerCase()}>`
    );
    return target;
  }

  /** Confirm the currently highlighted element as the selection */
  confirmSelection(): void {
    if (!this._currentElement) return;
    const info = this.detector.detectComponent(this._currentElement);
    if (info) {
      this._selectedComponent = info;
      this.onSelect?.(info);
      this.deactivate();
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (!this._isActive) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        this.deactivate();
        break;
      case 'Tab':
        e.preventDefault();
        e.stopPropagation();
        this.navigateToFocusable(e.shiftKey ? 'previous' : 'next');
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        if (this._currentElement) {
          this.navigateToParent();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        if (this._currentElement) {
          this.navigateToChild();
        }
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        this.confirmSelection();
        break;
    }
  }

  private createAriaLiveRegion(): void {
    this._ariaLiveRegion = document.createElement('div');
    this._ariaLiveRegion.setAttribute('aria-live', 'assertive');
    this._ariaLiveRegion.setAttribute('role', 'status');
    this._ariaLiveRegion.style.position = 'absolute';
    this._ariaLiveRegion.style.width = '1px';
    this._ariaLiveRegion.style.height = '1px';
    this._ariaLiveRegion.style.overflow = 'hidden';
    this._ariaLiveRegion.style.clip = 'rect(0 0 0 0)';
    this._ariaLiveRegion.style.whiteSpace = 'nowrap';
    this._ariaLiveRegion.id = 'feedbacker-aria-live';
    document.body.appendChild(this._ariaLiveRegion);
  }

  private removeAriaLiveRegion(): void {
    if (this._ariaLiveRegion) {
      this._ariaLiveRegion.remove();
      this._ariaLiveRegion = null;
    }
  }

  private announceToLiveRegion(message: string): void {
    if (this._ariaLiveRegion) {
      this._ariaLiveRegion.textContent = message;
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (!this._isActive) return;
    e.preventDefault();
    e.stopPropagation();

    // If no current element, use the hovered component's element
    if (!this._currentElement && this._hoveredComponent) {
      this._currentElement = this._hoveredComponent.element;
    }
    if (!this._currentElement) return;

    if (e.deltaY < 0) {
      // Scroll up — navigate to parent
      this.navigateToParent();
    } else if (e.deltaY > 0) {
      // Scroll down — navigate to child
      this.navigateToChild();
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target || this.isExtensionElement(target)) {
      this._hoveredComponent = null;
      this.onHover?.(null);
      return;
    }

    this._currentElement = target;
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

  private static readonly EXTENSION_IDS = new Set([
    'feedbacker-extension-root',
    'feedbacker-overlay',
    'feedbacker-breadcrumb',
    'feedbacker-aria-live',
  ]);

  private isExtensionElement(el: HTMLElement): boolean {
    // Check if element is part of our shadow DOM host, overlay, breadcrumb, or ARIA region
    if (DetectionController.EXTENSION_IDS.has(el.id)) {
      return true;
    }
    let node: Node | null = el;
    while (node) {
      if (node instanceof HTMLElement && DetectionController.EXTENSION_IDS.has(node.id)) {
        return true;
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
