/**
 * Focus trap — keeps Tab/Shift+Tab cycling within a container.
 * Prevents focus from escaping into the host page.
 */

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class FocusTrap {
  private container: HTMLElement;
  private handler: (e: KeyboardEvent) => void;
  private previousFocus: Element | null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.previousFocus = document.activeElement;

    this.handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = Array.from(this.container.querySelectorAll(FOCUSABLE)) as HTMLElement[];
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Get the active element — in shadow DOM, it may be in shadowRoot
      const root = this.container.getRootNode() as ShadowRoot | Document;
      const active = root.activeElement;

      if (e.shiftKey) {
        // Shift+Tab: if on first element (or nothing focused inside), wrap to last
        if (active === first || !this.container.contains(active as Node)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last element (or nothing focused inside), wrap to first
        if (active === last || !this.container.contains(active as Node)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    this.container.addEventListener('keydown', this.handler);
  }

  destroy(): void {
    this.container.removeEventListener('keydown', this.handler);
    // Restore previous focus if it's still in the DOM
    if (this.previousFocus instanceof HTMLElement && document.contains(this.previousFocus)) {
      this.previousFocus.focus();
    }
  }
}
