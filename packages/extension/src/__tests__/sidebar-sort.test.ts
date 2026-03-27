/**
 * Tests for sidebar sort functionality.
 * Covers Phase 3: T-016, T-017.
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

describe('Sidebar Sort', () => {
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

  function getCardIds(): string[] {
    const cards = container.querySelectorAll('.fb-card');
    return Array.from(cards).map((c) => (c as HTMLElement).dataset.fbId ?? '');
  }

  /**
   * T-016: Sort toggle reverses card order from newest-first to oldest-first.
   * Cards are provided newest-first (default). Toggle switches to oldest-first.
   */
  describe('T-016: Toggle reverses card order', () => {
    it('reverses card order when sort toggle is clicked', () => {
      const feedbacks = [
        createFeedback({ id: 'oldest', timestamp: '2024-01-01T00:00:00Z', comment: 'First' }),
        createFeedback({ id: 'middle', timestamp: '2024-06-01T00:00:00Z', comment: 'Second' }),
        createFeedback({ id: 'newest', timestamp: '2024-12-01T00:00:00Z', comment: 'Third' }),
      ];
      const sidebar = createSidebar(feedbacks);

      // Default order: as provided (newest-first is the app's responsibility;
      // the sidebar renders in array order)
      const initialOrder = getCardIds();
      expect(initialOrder).toEqual(['oldest', 'middle', 'newest']);

      // Click sort toggle
      const sortBtn = container.querySelector('.fb-sort-btn') as HTMLButtonElement;
      sortBtn.click();

      // Order should be reversed
      const reversedOrder = getCardIds();
      expect(reversedOrder).toEqual(['newest', 'middle', 'oldest']);

      // Click again to go back to original
      sortBtn.click();
      const restoredOrder = getCardIds();
      expect(restoredOrder).toEqual(['oldest', 'middle', 'newest']);

      sidebar.destroy();
    });

    it('uses DOM reordering (insertBefore), not rebuild', () => {
      const feedbacks = [
        createFeedback({ id: 'a', comment: 'A' }),
        createFeedback({ id: 'b', comment: 'B' }),
        createFeedback({ id: 'c', comment: 'C' }),
      ];
      const sidebar = createSidebar(feedbacks);

      // Capture original card DOM nodes
      const originalCards = Array.from(container.querySelectorAll('.fb-card'));

      // Toggle sort
      const sortBtn = container.querySelector('.fb-sort-btn') as HTMLButtonElement;
      sortBtn.click();

      // Same DOM nodes should still exist (not recreated)
      const reorderedCards = Array.from(container.querySelectorAll('.fb-card'));
      expect(reorderedCards.length).toBe(originalCards.length);
      for (const card of originalCards) {
        expect(reorderedCards).toContain(card);
      }

      sidebar.destroy();
    });
  });

  /**
   * T-017: Sort order resets to default on new sidebar instance.
   * Sort set to oldest-first, sidebar destroyed and recreated -> newest-first.
   */
  describe('T-017: Sort resets on new sidebar instance', () => {
    it('resets to newest-first (default) on new sidebar instance', () => {
      const feedbacks = [
        createFeedback({ id: 'a', comment: 'A' }),
        createFeedback({ id: 'b', comment: 'B' }),
        createFeedback({ id: 'c', comment: 'C' }),
      ];

      // First instance: toggle to oldest-first
      const sidebar1 = createSidebar(feedbacks);
      const sortBtn1 = container.querySelector('.fb-sort-btn') as HTMLButtonElement;
      sortBtn1.click();

      const sortedOrder = getCardIds();
      expect(sortedOrder).toEqual(['c', 'b', 'a']);

      sidebar1.destroy();

      // Second instance: should be newest-first (default = array order)
      const sidebar2 = createSidebar(feedbacks);

      const newOrder = getCardIds();
      expect(newOrder).toEqual(['a', 'b', 'c']);

      // Sort button should show "Newest"
      const sortBtn2 = container.querySelector('.fb-sort-btn') as HTMLButtonElement;
      expect(sortBtn2.textContent).toContain('Newest');

      sidebar2.destroy();
    });
  });
});
