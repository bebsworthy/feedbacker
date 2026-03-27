/**
 * Element relocation and highlight utilities for navigate-to-element feature.
 *
 * `relocateElement` finds a DOM element by CSS selector.
 * `highlightElement` scrolls to an element and shows a temporary overlay.
 */

const DEFAULT_HIGHLIGHT_DURATION_MS = 3000;

/**
 * Attempts to find an element on the page using the given CSS selector.
 * Returns the element if found, `null` otherwise.
 */
export function relocateElement(selector: string): HTMLElement | null {
  try {
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) {
      return el;
    }
    return null;
  } catch {
    // Invalid selector syntax
    return null;
  }
}

/**
 * Scrolls the element into view and shows a temporary highlight overlay
 * that auto-dismisses after `durationMs` (default 3000ms).
 *
 * Uses inline styles (same approach as ComponentOverlayUI) to avoid
 * Shadow DOM CSS scope issues. Leaves no persistent DOM behind.
 */
export function highlightElement(
  element: HTMLElement,
  durationMs: number = DEFAULT_HIGHLIGHT_DURATION_MS
): void {
  // Remove any existing highlight overlay before creating a new one
  const existing = document.querySelector('[data-feedbacker-highlight]');
  if (existing) existing.remove();

  element.scrollIntoView({ behavior: 'instant', block: 'center' });

  const overlay = document.createElement('div');
  overlay.setAttribute('data-feedbacker-highlight', 'true');
  overlay.setAttribute('aria-hidden', 'true');

  const rect = element.getBoundingClientRect();

  overlay.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.08);
    pointer-events: none;
    z-index: 2147483646;
    box-sizing: border-box;
    transition: opacity 0.3s ease-out;
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.style.opacity = '0';
    // Remove after fade-out transition completes
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }, durationMs);

}
