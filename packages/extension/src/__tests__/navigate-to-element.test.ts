/**
 * Tests for element-relocator utilities.
 * Covers T-041 (locate + scroll + highlight + auto-dismiss) and T-042 (element not found).
 */

import { relocateElement, highlightElement } from '../utils/element-relocator';

describe('relocateElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the element when the selector matches (T-041)', () => {
    const el = document.createElement('button');
    el.id = 'submit-btn';
    document.body.appendChild(el);

    const result = relocateElement('#submit-btn');
    expect(result).toBe(el);
  });

  it('returns null when no element matches the selector (T-042)', () => {
    const result = relocateElement('#non-existent');
    expect(result).toBeNull();
  });

  it('returns null for an invalid selector', () => {
    const result = relocateElement('[invalid===');
    expect(result).toBeNull();
  });

  it('returns null for non-HTMLElement matches (e.g. SVG without HTMLElement prototype)', () => {
    // querySelector can return non-HTMLElement nodes; relocateElement should guard
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'my-svg';
    document.body.appendChild(svg);

    // SVGSVGElement extends SVGElement extends Element but not HTMLElement in jsdom
    // However in jsdom SVGElement may extend HTMLElement, so we test the interface works
    const result = relocateElement('#my-svg');
    // Should return the element if it's an HTMLElement instance, null otherwise
    if (svg instanceof HTMLElement) {
      expect(result).toBe(svg);
    } else {
      expect(result).toBeNull();
    }
  });

  it('finds elements by data-testid selector', () => {
    const el = document.createElement('div');
    el.setAttribute('data-testid', 'login-form');
    document.body.appendChild(el);

    const result = relocateElement('[data-testid="login-form"]');
    expect(result).toBe(el);
  });
});

describe('highlightElement', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('calls scrollIntoView with smooth center behavior (T-041)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.scrollIntoView = jest.fn();

    highlightElement(el);

    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('creates a highlight overlay in the DOM (T-041)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.scrollIntoView = jest.fn();

    highlightElement(el);

    const overlay = document.querySelector('[data-feedbacker-highlight]');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
  });

  it('highlight overlay has correct styling (T-041)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.scrollIntoView = jest.fn();

    highlightElement(el);

    const overlay = document.querySelector('[data-feedbacker-highlight]') as HTMLElement;
    expect(overlay.style.position).toBe('fixed');
    expect(overlay.style.border).toContain('#3b82f6');
    expect(overlay.style.pointerEvents).toBe('none');
    expect(overlay.style.zIndex).toBe('2147483646');
  });

  it('auto-dismisses after default duration of 3s (T-041)', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.scrollIntoView = jest.fn();

    highlightElement(el);

    expect(document.querySelector('[data-feedbacker-highlight]')).not.toBeNull();

    // Advance past the 3s duration
    jest.advanceTimersByTime(3000);

    // Overlay starts fade-out (opacity 0), still in DOM
    const overlay = document.querySelector('[data-feedbacker-highlight]') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.opacity).toBe('0');

    // Advance past the 300ms fade-out transition
    jest.advanceTimersByTime(300);

    // Now overlay is removed from DOM
    expect(document.querySelector('[data-feedbacker-highlight]')).toBeNull();
  });

  it('leaves no persistent DOM behind after dismissal (T-041)', () => {
    const el = document.createElement('div');
    el.id = 'target';
    document.body.appendChild(el);
    el.scrollIntoView = jest.fn();

    const childCountBefore = document.body.children.length;

    highlightElement(el);
    expect(document.body.children.length).toBe(childCountBefore + 1);

    // Complete full lifecycle
    jest.advanceTimersByTime(3300);

    expect(document.body.children.length).toBe(childCountBefore);
  });

  it('uses custom duration when provided', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.scrollIntoView = jest.fn();

    highlightElement(el, 1000);

    // Should still be present before 1s
    jest.advanceTimersByTime(999);
    expect(document.querySelector('[data-feedbacker-highlight]')).not.toBeNull();

    // Should start fade-out at 1s
    jest.advanceTimersByTime(1);
    const overlay = document.querySelector('[data-feedbacker-highlight]') as HTMLElement;
    expect(overlay.style.opacity).toBe('0');

    // Should be removed after fade-out
    jest.advanceTimersByTime(300);
    expect(document.querySelector('[data-feedbacker-highlight]')).toBeNull();
  });
});
