/**
 * BreadcrumbTrail — renders ancestor chain for the currently selected element
 * during component detection. Appended to document.body (same pattern as overlay).
 *
 * Max 6 segments; deeper hierarchies show ellipsis for truncated ancestors.
 * Last segment is visually distinguished (bold).
 */

import { getHumanReadableName } from '@feedbacker/detection';

const MAX_SEGMENTS = 6;

export class BreadcrumbTrail {
  private containerEl: HTMLDivElement | null = null;

  /** Create the breadcrumb DOM element and append to document.body */
  activate(): void {
    if (this.containerEl) return;

    this.containerEl = document.createElement('div');
    this.containerEl.id = 'feedbacker-breadcrumb';
    this.containerEl.setAttribute('aria-label', 'Element hierarchy breadcrumb');
    this.containerEl.style.cssText = `
      position: fixed;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      padding: 6px 12px;
      background: rgba(30, 58, 95, 0.95);
      color: white;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      border-radius: 6px;
      white-space: nowrap;
      z-index: 2147483646;
      pointer-events: none;
      display: none;
      max-width: 90vw;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    document.body.appendChild(this.containerEl);
  }

  /** Remove the breadcrumb DOM element */
  deactivate(): void {
    if (this.containerEl) {
      this.containerEl.remove();
      this.containerEl = null;
    }
  }

  /** Update the breadcrumb to reflect the ancestor chain of the given element */
  update(element: HTMLElement): void {
    if (!this.containerEl) return;

    const segments = this.buildSegments(element);
    if (segments.length === 0) {
      this.containerEl.style.display = 'none';
      return;
    }

    this.containerEl.innerHTML = '';
    this.containerEl.style.display = 'block';

    const ancestors = this.getAncestorChain(element);
    const truncated = ancestors.length > MAX_SEGMENTS;

    const displaySegments = truncated
      ? segments.slice(segments.length - MAX_SEGMENTS)
      : segments;

    if (truncated) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '\u2026 ';
      ellipsis.style.cssText = 'opacity: 0.6; margin-right: 2px;';
      this.containerEl.appendChild(ellipsis);
    }

    displaySegments.forEach((label, index) => {
      if (index > 0) {
        const separator = document.createElement('span');
        separator.textContent = ' \u203A ';
        separator.style.opacity = '0.6';
        this.containerEl!.appendChild(separator);
      }

      const span = document.createElement('span');
      span.textContent = label;

      const isLast = index === displaySegments.length - 1;
      if (isLast) {
        span.style.fontWeight = '700';
      } else {
        span.style.opacity = '0.8';
      }

      this.containerEl!.appendChild(span);
    });
  }

  /** Get the DOM container element (for testing) */
  getElement(): HTMLDivElement | null {
    return this.containerEl;
  }

  /** Build an array of human-readable labels from root to the target element */
  private buildSegments(element: HTMLElement): string[] {
    const chain = this.getAncestorChain(element);
    return chain.map((el) => getHumanReadableName(el));
  }

  /** Get ancestor chain from root to target (inclusive), excluding document */
  private getAncestorChain(element: HTMLElement): HTMLElement[] {
    const chain: HTMLElement[] = [];
    let current: HTMLElement | null = element;

    while (current) {
      chain.unshift(current);
      current = current.parentElement;
    }

    return chain;
  }
}
