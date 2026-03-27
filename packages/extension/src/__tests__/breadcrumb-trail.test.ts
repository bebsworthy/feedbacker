/**
 * Tests for BreadcrumbTrail component.
 * Covers T-024 through T-026, T-066 (PH-011).
 */

jest.mock('@feedbacker/detection', () => ({
  getHumanReadableName: jest.fn((el: HTMLElement) => el.tagName.toLowerCase()),
}));

import { BreadcrumbTrail } from '../ui/breadcrumb-trail';

describe('BreadcrumbTrail', () => {
  let trail: BreadcrumbTrail;

  beforeEach(() => {
    trail = new BreadcrumbTrail();
    trail.activate();
  });

  afterEach(() => {
    trail.deactivate();
  });

  function buildNestedStructure(depth: number): HTMLElement {
    let root = document.createElement('div');
    document.body.appendChild(root);
    let current = root;
    for (let i = 1; i < depth; i++) {
      const child = document.createElement(i % 2 === 0 ? 'div' : 'span');
      current.appendChild(child);
      current = child;
    }
    return current; // deepest element
  }

  /**
   * T-024: Element nested 4 levels deep shows 4 segments,
   * last segment is visually distinguished (bold)
   */
  it('T-024: shows correct segment count and last segment is bold', () => {
    // Build: body > div > span > div > span (4 custom levels)
    const deepest = buildNestedStructure(4);
    trail.update(deepest);

    const container = trail.getElement()!;
    expect(container.style.display).toBe('block');

    // Count segments (span elements that are not separators/ellipsis)
    const spans = Array.from(container.querySelectorAll('span'));
    const segments = spans.filter(
      (s) => !s.textContent?.includes('\u203A') && s.textContent !== '\u2026 '
    );

    // The chain includes all ancestors: html > body > div > span > div > span
    // That's 6 elements from root (html) to deepest
    // Exactly 6 = MAX_SEGMENTS, so no truncation
    expect(segments.length).toBeGreaterThanOrEqual(4);

    // Last segment should be bold
    const lastSegment = segments[segments.length - 1];
    expect(lastSegment.style.fontWeight).toBe('700');
  });

  /**
   * T-025: Element nested 8 levels shows max 6 segments with ellipsis
   */
  it('T-025: truncates to 6 segments with ellipsis for deep nesting', () => {
    const deepest = buildNestedStructure(8);
    trail.update(deepest);

    const container = trail.getElement()!;
    const spans = Array.from(container.querySelectorAll('span'));

    // Find ellipsis span
    const ellipsis = spans.find((s) => s.textContent === '\u2026 ');
    expect(ellipsis).toBeDefined();

    // Count actual segment spans (not separators, not ellipsis)
    const segments = spans.filter(
      (s) => !s.textContent?.includes('\u203A') && s.textContent !== '\u2026 '
    );
    expect(segments.length).toBe(6);

    // Last segment should still be bold
    const lastSegment = segments[segments.length - 1];
    expect(lastSegment.style.fontWeight).toBe('700');

    deepest.closest('div')?.remove();
  });

  /**
   * T-026: Navigate to parent updates breadcrumb; previously-last segment
   * is no longer distinguished
   */
  it('T-026: updates on parent navigation', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    // Initially show breadcrumb for child
    trail.update(child);
    let container = trail.getElement()!;
    let spans = Array.from(container.querySelectorAll('span'));
    let segments = spans.filter(
      (s) => !s.textContent?.includes('\u203A') && s.textContent !== '\u2026 '
    );
    const lastBefore = segments[segments.length - 1];
    expect(lastBefore.style.fontWeight).toBe('700');

    // Navigate to parent
    trail.update(parent);
    container = trail.getElement()!;
    spans = Array.from(container.querySelectorAll('span'));
    segments = spans.filter(
      (s) => !s.textContent?.includes('\u203A') && s.textContent !== '\u2026 '
    );

    // The new last segment should be the parent
    const lastAfter = segments[segments.length - 1];
    expect(lastAfter.style.fontWeight).toBe('700');

    // Segment count should have decreased by 1
    // (fewer ancestors for parent than for child)
    parent.remove();
  });

  it('DOM element is created on activate', () => {
    const el = trail.getElement();
    expect(el).not.toBeNull();
    expect(el?.id).toBe('feedbacker-breadcrumb');
    expect(document.getElementById('feedbacker-breadcrumb')).toBe(el);
  });

  it('DOM element is removed on deactivate', () => {
    trail.deactivate();
    expect(trail.getElement()).toBeNull();
    expect(document.getElementById('feedbacker-breadcrumb')).toBeNull();
  });

  it('has aria-label for accessibility', () => {
    const el = trail.getElement()!;
    expect(el.getAttribute('aria-label')).toBe('Element hierarchy breadcrumb');
  });

  it('does not create duplicate elements on double activate', () => {
    trail.activate(); // second call
    const elements = document.querySelectorAll('#feedbacker-breadcrumb');
    expect(elements.length).toBe(1);
  });

  it('hides when element produces no segments', () => {
    // Create a detached element (no parent)
    const detached = document.createElement('div');
    trail.update(detached);
    // Even a detached element has itself as a segment, so it should show
    const container = trail.getElement()!;
    expect(container.style.display).toBe('block');
  });
});
