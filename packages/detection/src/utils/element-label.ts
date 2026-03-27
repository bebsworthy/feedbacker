/**
 * Build a concise label for a DOM element.
 * Format: tag[.firstClass][[name]][ "aria-label"]
 *
 * Examples:
 *   input.file[email] "Email address"
 *   nav "Main navigation"
 *   div.flex
 *   button "Submit"
 */

const MAX_ARIA_LENGTH = 30;
const FORM_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA']);

export function buildElementLabel(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();

  // First class only (avoids Tailwind explosion)
  const firstClass = element.classList.length > 0 ? element.classList[0] : null;
  let label = firstClass ? `${tag}.${firstClass}` : tag;

  // Form name attribute
  const nameAttr = element.getAttribute('name');
  if (nameAttr && FORM_TAGS.has(element.tagName)) {
    label += `[${nameAttr}]`;
  }

  // Aria-label for context
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim().length > 0) {
    const trimmed = ariaLabel.trim();
    const text = trimmed.length > MAX_ARIA_LENGTH
      ? trimmed.slice(0, MAX_ARIA_LENGTH) + '\u2026'
      : trimmed;
    label += ` "${text}"`;
  }

  return label;
}
