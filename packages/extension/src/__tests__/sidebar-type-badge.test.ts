/**
 * Tests for sidebar type badges (PH-013).
 * Covers: T-034, T-035, T-036.
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
    type: overrides.type,
    severity: overrides.severity,
  };
}

describe('Sidebar type badges', () => {
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

  function createSidebar(feedbacks: Feedback[]) {
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

  /**
   * T-034: Feedback with type 'bug' shows red badge with text "Bug".
   */
  it('T-034: bug feedback shows red badge with text "Bug"', () => {
    const sidebar = createSidebar([createFeedback({ type: 'bug' })]);

    const badge = container.querySelector('.fb-type-badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('Bug');
    expect(badge.classList.contains('fb-type-bug')).toBe(true);

    sidebar.destroy();
  });

  /**
   * T-035: Feedback with type 'suggestion' shows blue badge with text "Suggestion".
   */
  it('T-035: suggestion feedback shows blue badge with text "Suggestion"', () => {
    const sidebar = createSidebar([createFeedback({ type: 'suggestion' })]);

    const badge = container.querySelector('.fb-type-badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('Suggestion');
    expect(badge.classList.contains('fb-type-suggestion')).toBe(true);

    sidebar.destroy();
  });

  /**
   * T-036: Pre-existing feedback with no type field renders without badge and without errors.
   */
  it('T-036: feedback without type renders without badge and without errors', () => {
    const sidebar = createSidebar([createFeedback()]);

    const badge = container.querySelector('.fb-type-badge');
    expect(badge).toBeNull();

    // Card should still render properly
    const card = container.querySelector('.fb-card');
    expect(card).not.toBeNull();
    const comment = container.querySelector('.fb-card-comment');
    expect(comment).not.toBeNull();
    expect(comment!.textContent).toBe('Test feedback comment');

    sidebar.destroy();
  });

  /**
   * Additional: question type shows purple badge.
   */
  it('question feedback shows badge with text "Question"', () => {
    const sidebar = createSidebar([createFeedback({ type: 'question' })]);

    const badge = container.querySelector('.fb-type-badge') as HTMLElement;
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('Question');
    expect(badge.classList.contains('fb-type-question')).toBe(true);

    sidebar.destroy();
  });
});
