/**
 * Shadow DOM Host — creates an isolated container for the extension UI
 * Uses closed mode to prevent page CSS/JS interference
 */

import { EXTENSION_CSS } from '../styles/extension-css';

const HOST_ID = 'feedbacker-extension-root';

export class ShadowHost {
  private host: HTMLDivElement;
  private shadow: ShadowRoot;
  private container: HTMLDivElement;

  constructor() {
    // Create host element
    this.host = document.createElement('div');
    this.host.id = HOST_ID;
    this.host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; top: 0; left: 0; width: 0; height: 0;';

    // Create closed shadow root
    this.shadow = this.host.attachShadow({ mode: 'closed' });

    // Inject styles
    const style = document.createElement('style');
    style.textContent = EXTENSION_CSS;
    this.shadow.appendChild(style);

    // Create container for UI components
    this.container = document.createElement('div');
    this.container.className = 'feedbacker-container';
    this.shadow.appendChild(this.container);

    // Stop keyboard and input events from leaking to the host page.
    // Shadow DOM re-targets events but they still bubble up to the
    // document where page-level listeners (e.g. GitHub's hotkeys) can
    // intercept them.
    const swallowed: (keyof HTMLElementEventMap)[] = [
      // Keyboard
      'keydown', 'keyup', 'keypress',
      // Input / composition
      'input', 'beforeinput', 'compositionstart', 'compositionend', 'compositionupdate',
      // Mouse
      'click', 'dblclick', 'auxclick', 'contextmenu',
      'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
      // Pointer (covers touch + pen + mouse)
      'pointerdown', 'pointerup', 'pointermove', 'pointerover', 'pointerout', 'pointerenter', 'pointerleave',
      // Focus
      'focus', 'blur', 'focusin', 'focusout',
      // Touch
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      // Scroll / wheel
      'wheel',
      // Drag
      'dragstart', 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'drop',
      // Form
      'change', 'select', 'submit', 'reset'
    ];
    for (const type of swallowed) {
      this.host.addEventListener(type, (e) => e.stopPropagation());
    }

    // Append to body
    document.body.appendChild(this.host);
  }

  /** Get the container element inside shadow DOM for rendering UI */
  getContainer(): HTMLDivElement {
    return this.container;
  }

  /** Get the shadow root for advanced operations */
  getShadowRoot(): ShadowRoot {
    return this.shadow;
  }

  /** Remove the extension from the page */
  destroy(): void {
    this.host.remove();
  }

  /** Check if the host is still in the DOM */
  isAttached(): boolean {
    return document.body.contains(this.host);
  }
}
