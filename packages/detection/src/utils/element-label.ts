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

/** Tailwind-style prefixes and single-purpose utility patterns to skip */
const UTILITY_CLASS_RE = /^(w-|h-|p-|m-|bg-|text-|flex|grid|hidden|absolute|relative|fixed|border|rounded|shadow|outline|ring|transition|opacity|overflow|cursor|pointer|select-|z-|gap-|space-|items-|justify-|self-|font-|leading-|tracking-|whitespace-|break-|align-|max-|min-|inset-|top-|right-|bottom-|left-|block|inline|table|sr-only|not-sr-only|px-|py-|pt-|pr-|pb-|pl-|mt-|mr-|mb-|ml-|mx-|my-|col-|row-)/;

/** Classes with variant prefixes like file:, hover:, focus:, dark:, md:, aria-invalid: */
const VARIANT_PREFIX_RE = /^[a-z][\w-]*:/;

function findMeaningfulClass(classList: DOMTokenList): string | null {
  for (let i = 0; i < classList.length; i++) {
    const cls = classList[i];
    if (!VARIANT_PREFIX_RE.test(cls) && !UTILITY_CLASS_RE.test(cls) && cls.length > 1) {
      return cls;
    }
  }
  // If all classes are utilities, just skip — show tag only
  return null;
}

export function buildElementLabel(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();

  // First meaningful class (skip Tailwind utilities/variants)
  const firstClass = findMeaningfulClass(element.classList);
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
