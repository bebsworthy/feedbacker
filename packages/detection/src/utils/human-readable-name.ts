/**
 * Human-readable name resolution for DOM elements.
 *
 * Resolves a display-friendly name using a 6-step priority chain:
 * 1. aria-label
 * 2. aria-labelledby (resolved via getElementById)
 * 3. Direct text content (skipped for containers with >2 children)
 * 4. Role attribute (capitalized)
 * 5. Component name (if provided and not "Unknown")
 * 6. Tag name fallback (with first class if present)
 */

const MAX_TEXT_LENGTH = 40;
const MAX_CHILDREN_FOR_TEXT = 2;

/**
 * Truncate text to `MAX_TEXT_LENGTH` characters, appending ellipsis if needed.
 */
function truncate(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_TEXT_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, MAX_TEXT_LENGTH) + '\u2026';
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(text: string): string {
  if (text.length === 0) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Extract direct text content from an element's child text nodes.
 * Returns null if the element has too many children (container heuristic).
 */
function getDirectTextContent(element: HTMLElement): string | null {
  if (element.children.length > MAX_CHILDREN_FOR_TEXT) {
    return null;
  }

  let text = '';
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
    }
  }

  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve a human-readable name for a DOM element.
 *
 * @param element - The target HTML element
 * @param componentName - Optional React/framework component name
 * @returns A non-empty display name string
 */
export function getHumanReadableName(
  element: HTMLElement,
  componentName?: string
): string {
  // Step 1: aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim().length > 0) {
    return truncate(ariaLabel);
  }

  // Step 2: aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) {
      const labelText = (labelEl.textContent ?? '').trim();
      if (labelText.length > 0) {
        return truncate(labelText);
      }
    }
  }

  // Step 3: Direct text content (skip containers with >2 children)
  const directText = getDirectTextContent(element);
  if (directText) {
    return truncate(directText);
  }

  // Step 4: Role attribute
  const role = element.getAttribute('role');
  if (role && role.trim().length > 0) {
    return capitalize(role.trim());
  }

  // Step 5: Component name
  if (componentName && componentName !== 'Unknown') {
    return componentName;
  }

  // Step 6: Tag name fallback with optional first class
  const tag = element.tagName.toLowerCase();
  const firstClass = element.classList.length > 0 ? element.classList[0] : null;
  if (firstClass) {
    return `${tag}.${firstClass}`;
  }

  return tag;
}
