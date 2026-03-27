/**
 * Tests for element-relocator utilities and sidebar locate integration.
 * Covers T-041 (locate + scroll + highlight + auto-dismiss), T-042 (element not found),
 * T-043 (cross-origin cards have no locate icon), T-044 (sidebar stays open during highlight).
 */

import { relocateElement, highlightElement } from '../utils/element-relocator';
import { ManagerSidebar } from '../ui/sidebar';
import type { Feedback } from '@feedbacker/core';

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

// ============================================================
// Sidebar locate icon integration tests (T-043, T-044)
// ============================================================

// Mock clipboard API for sidebar
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    write: jest.fn().mockResolvedValue(undefined),
  },
});

function createFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: overrides.id ?? 'fb_1',
    componentName: overrides.componentName ?? 'TestComponent',
    componentPath: overrides.componentPath ?? ['App', 'TestComponent'],
    comment: overrides.comment ?? 'Test feedback comment',
    url: overrides.url ?? 'https://example.com/page',
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    browserInfo: overrides.browserInfo ?? {
      userAgent: 'test',
      viewport: { width: 1024, height: 768 },
      platform: 'test',
    },
    screenshot: overrides.screenshot,
    htmlSnippet: overrides.htmlSnippet,
    elementSelector: overrides.elementSelector,
  };
}

describe('Sidebar locate icon (T-043, T-044)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', href: 'https://example.com/page' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    container.remove();
  });

  function createSidebar(overrides: Partial<{
    feedbacks: Feedback[];
    onClose: jest.Mock;
    onDelete: jest.Mock;
    onSaveEdit: jest.Mock;
    onShowExportDialog: jest.Mock;
    onStartCapture: jest.Mock;
    onAnnounce: jest.Mock;
    onLocateElement: jest.Mock;
    currentOrigin: string;
  }> = {}) {
    return new ManagerSidebar(container, {
      feedbacks: overrides.feedbacks ?? [createFeedback()],
      onClose: overrides.onClose ?? jest.fn(),
      onDelete: overrides.onDelete ?? jest.fn(),
      onSaveEdit: overrides.onSaveEdit ?? jest.fn().mockResolvedValue(undefined),
      onShowExportDialog: overrides.onShowExportDialog ?? jest.fn(),
      onStartCapture: overrides.onStartCapture ?? jest.fn(),
      onAnnounce: overrides.onAnnounce ?? jest.fn(),
      onLocateElement: overrides.onLocateElement ?? jest.fn(),
      currentOrigin: overrides.currentOrigin ?? 'https://example.com',
    });
  }

  /**
   * T-043: Card for feedback captured on a different origin has no locate icon.
   */
  describe('T-043: Cross-origin cards have no locate icon', () => {
    it('does not render locate icon for cross-origin card even with elementSelector', () => {
      const sidebar = createSidebar({
        feedbacks: [createFeedback({
          url: 'https://other-site.com/page',
          elementSelector: '#submit-btn',
        })],
        currentOrigin: 'https://example.com',
      });

      const locateBtn = container.querySelector('[aria-label="Locate element"]');
      expect(locateBtn).toBeNull();

      sidebar.destroy();
    });

    it('renders locate icon for same-origin card with elementSelector', () => {
      const sidebar = createSidebar({
        feedbacks: [createFeedback({
          url: 'https://example.com/page',
          elementSelector: '#submit-btn',
        })],
        currentOrigin: 'https://example.com',
      });

      const locateBtn = container.querySelector('[aria-label="Locate element"]');
      expect(locateBtn).not.toBeNull();

      sidebar.destroy();
    });

    it('does not render locate icon for same-origin card without elementSelector', () => {
      const sidebar = createSidebar({
        feedbacks: [createFeedback({
          url: 'https://example.com/page',
          // no elementSelector
        })],
        currentOrigin: 'https://example.com',
      });

      const locateBtn = container.querySelector('[aria-label="Locate element"]');
      expect(locateBtn).toBeNull();

      sidebar.destroy();
    });

    it('mixed cards in all-sites view: only same-origin with selector gets locate icon', () => {
      const sidebar = createSidebar({
        feedbacks: [
          createFeedback({ id: 'fb_same', url: 'https://example.com/a', elementSelector: '.btn' }),
          createFeedback({ id: 'fb_cross', url: 'https://other.com/b', elementSelector: '.btn' }),
          createFeedback({ id: 'fb_no_sel', url: 'https://example.com/c' }),
        ],
        currentOrigin: 'https://example.com',
      });

      // Switch to "all-sites" to see all cards including cross-origin
      const allSitesTab = container.querySelector('[data-filter="all-sites"]') as HTMLElement;
      allSitesTab.click();

      const cards = container.querySelectorAll('.fb-card');
      expect(cards.length).toBe(3);

      // Only the first card (same-origin with selector) should have locate icon
      const card1 = cards[0] as HTMLElement;
      const card2 = cards[1] as HTMLElement;
      const card3 = cards[2] as HTMLElement;

      expect(card1.querySelector('[aria-label="Locate element"]')).not.toBeNull();
      expect(card2.querySelector('[aria-label="Locate element"]')).toBeNull();
      expect(card3.querySelector('[aria-label="Locate element"]')).toBeNull();

      sidebar.destroy();
    });
  });

  /**
   * T-044: Sidebar remains open during locate and highlight.
   */
  describe('T-044: Sidebar stays open during locate', () => {
    it('clicking locate icon does not destroy or close sidebar', () => {
      const onClose = jest.fn();
      const onLocateElement = jest.fn();
      const sidebar = createSidebar({
        feedbacks: [createFeedback({
          url: 'https://example.com/page',
          elementSelector: '#target',
        })],
        onClose,
        onLocateElement,
        currentOrigin: 'https://example.com',
      });

      const locateBtn = container.querySelector('[aria-label="Locate element"]') as HTMLButtonElement;
      expect(locateBtn).not.toBeNull();

      locateBtn.click();

      // onLocateElement should be called
      expect(onLocateElement).toHaveBeenCalledWith(expect.objectContaining({
        elementSelector: '#target',
      }));

      // onClose should NOT be called
      expect(onClose).not.toHaveBeenCalled();

      // Sidebar should still be in the DOM
      expect(container.querySelector('.fb-sidebar')).not.toBeNull();
      expect(container.querySelector('.fb-sidebar-backdrop')).not.toBeNull();

      sidebar.destroy();
    });

    it('locate icon has correct tooltip and aria-label', () => {
      const sidebar = createSidebar({
        feedbacks: [createFeedback({
          url: 'https://example.com/page',
          elementSelector: '#btn',
        })],
        currentOrigin: 'https://example.com',
      });

      const locateBtn = container.querySelector('[aria-label="Locate element"]') as HTMLElement;
      expect(locateBtn).not.toBeNull();
      expect(locateBtn.dataset.tooltip).toBe('Locate element');

      sidebar.destroy();
    });
  });
});
