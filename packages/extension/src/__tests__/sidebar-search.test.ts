/**
 * Tests for sidebar search functionality.
 * Covers Phase 3: T-011, T-012, T-013, T-014, T-015.
 */

import { ManagerSidebar } from '../ui/sidebar';
import type { Feedback } from '@feedbacker/core';

// Mock clipboard API
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
  };
}

describe('Sidebar Search', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', href: 'https://example.com/page' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    container.remove();
  });

  function createSidebar(feedbacks: Feedback[] = []) {
    return new ManagerSidebar(container, {
      feedbacks,
      onClose: jest.fn(),
      onDelete: jest.fn(),
      onSaveEdit: jest.fn().mockResolvedValue(undefined),
      onShowExportDialog: jest.fn(),
      onStartCapture: jest.fn(),
      onAnnounce: jest.fn(),
    });
  }

  function typeSearch(term: string): void {
    const input = container.querySelector('.fb-search-input') as HTMLInputElement;
    input.value = term;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    jest.advanceTimersByTime(300);
  }

  /**
   * T-011: Search term matches 2 of 5 items by comment text.
   * Only 2 cards visible; 3 cards have .fb-card-hidden class.
   */
  describe('T-011: Filter cards by comment text', () => {
    it('shows only matching cards and hides non-matching ones', () => {
      const feedbacks = [
        createFeedback({ id: '1', comment: 'Login button is broken' }),
        createFeedback({ id: '2', comment: 'Header alignment issue' }),
        createFeedback({ id: '3', comment: 'Login form needs validation' }),
        createFeedback({ id: '4', comment: 'Footer looks great' }),
        createFeedback({ id: '5', comment: 'Sidebar needs work' }),
      ];
      const sidebar = createSidebar(feedbacks);

      typeSearch('login');

      const allCards = container.querySelectorAll('.fb-card');
      const hiddenCards = container.querySelectorAll('.fb-card.fb-card-hidden');
      const visibleCards = container.querySelectorAll('.fb-card:not(.fb-card-hidden)');

      expect(allCards.length).toBe(5);
      expect(hiddenCards.length).toBe(3);
      expect(visibleCards.length).toBe(2);

      sidebar.destroy();
    });
  });

  /**
   * T-012: Search term matches item by URL substring.
   * Matching card remains visible.
   */
  describe('T-012: Filter cards by URL', () => {
    it('matches cards by URL substring (case-insensitive)', () => {
      const feedbacks = [
        createFeedback({ id: '1', comment: 'Issue A', url: 'https://example.com/dashboard' }),
        createFeedback({ id: '2', comment: 'Issue B', url: 'https://example.com/settings' }),
        createFeedback({ id: '3', comment: 'Issue C', url: 'https://example.com/profile' }),
      ];
      const sidebar = createSidebar(feedbacks);

      typeSearch('settings');

      const visibleCards = container.querySelectorAll('.fb-card:not(.fb-card-hidden)');
      expect(visibleCards.length).toBe(1);
      expect((visibleCards[0] as HTMLElement).dataset.fbId).toBe('2');

      sidebar.destroy();
    });
  });

  /**
   * T-013: Search term matches item by element name (componentName).
   * Matching card remains visible.
   */
  describe('T-013: Filter cards by componentName', () => {
    it('matches cards by componentName (case-insensitive)', () => {
      const feedbacks = [
        createFeedback({ id: '1', comment: 'Issue', componentName: 'NavBar' }),
        createFeedback({ id: '2', comment: 'Issue', componentName: 'Footer' }),
        createFeedback({ id: '3', comment: 'Issue', componentName: 'NavigationMenu' }),
      ];
      const sidebar = createSidebar(feedbacks);

      typeSearch('nav');

      const visibleCards = container.querySelectorAll('.fb-card:not(.fb-card-hidden)');
      expect(visibleCards.length).toBe(2);

      const visibleIds = Array.from(visibleCards).map((c) => (c as HTMLElement).dataset.fbId);
      expect(visibleIds).toContain('1');
      expect(visibleIds).toContain('3');

      sidebar.destroy();
    });
  });

  /**
   * T-014: Search term matches no items.
   * "No matching feedback" message displayed.
   */
  describe('T-014: No matching feedback empty state', () => {
    it('shows "No matching feedback" when no cards match', () => {
      const feedbacks = [
        createFeedback({ id: '1', comment: 'Alpha' }),
        createFeedback({ id: '2', comment: 'Beta' }),
      ];
      const sidebar = createSidebar(feedbacks);

      typeSearch('zzzznonexistent');

      const noMatch = container.querySelector('.fb-no-match') as HTMLElement;
      expect(noMatch).not.toBeNull();
      expect(noMatch.style.display).not.toBe('none');
      expect(noMatch.textContent).toBe('No matching feedback');

      sidebar.destroy();
    });
  });

  /**
   * T-015: Search persists across filter tab switches.
   * Search term persists; filter applies to new tab's items.
   */
  describe('T-015: Search persists across tab switches', () => {
    it('preserves search term when switching from This site to All sites', () => {
      const feedbacks = [
        createFeedback({ id: '1', comment: 'Login issue', url: 'https://example.com/page' }),
        createFeedback({ id: '2', comment: 'Other bug', url: 'https://example.com/page' }),
        createFeedback({ id: '3', comment: 'Login problem', url: 'https://other.com/page' }),
      ];
      const sidebar = createSidebar(feedbacks);

      // Search for "login" on This site tab
      typeSearch('login');

      const input = container.querySelector('.fb-search-input') as HTMLInputElement;
      expect(input.value).toBe('login');

      // Switch to All sites
      const allSitesTab = container.querySelector('[data-filter="all-sites"]') as HTMLElement;
      allSitesTab.click();

      // Search input should still have the search term
      const inputAfter = container.querySelector('.fb-search-input') as HTMLInputElement;
      expect(inputAfter.value).toBe('login');

      // All sites: 3 total items, 2 match "login"
      const visibleCards = container.querySelectorAll('.fb-card:not(.fb-card-hidden)');
      expect(visibleCards.length).toBe(2);

      sidebar.destroy();
    });
  });
});
