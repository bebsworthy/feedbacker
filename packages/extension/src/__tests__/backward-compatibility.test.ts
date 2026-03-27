/**
 * Backward compatibility tests for pre-phase-3 feedback items.
 * Pre-phase-3 feedback has no `type`, `severity`, or `elementSelector` fields.
 *
 * Covers: T-062, T-063, T-070
 */

import { ManagerSidebar } from '../ui/sidebar';
import { MarkdownExporter, ZipExporter } from '@feedbacker/core';
import type { Feedback } from '@feedbacker/core';

// ---------------------------------------------------------------------------
// JSZip mock (for ZipExporter)
// ---------------------------------------------------------------------------

const mockFile = jest.fn();
const mockFolder = jest.fn();
const mockGenerateAsync = jest.fn();

jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: mockFile,
    folder: mockFolder,
    generateAsync: mockGenerateAsync,
  }));
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    write: jest.fn().mockResolvedValue(undefined),
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a pre-phase-3 feedback object: no type, no severity, no elementSelector.
 */
function createLegacyFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: overrides.id ?? 'legacy_1',
    componentName: overrides.componentName ?? 'OldComponent',
    componentPath: overrides.componentPath ?? ['App', 'OldComponent'],
    comment: overrides.comment ?? 'This is legacy feedback from before phase 3',
    url: overrides.url ?? 'https://example.com/legacy',
    timestamp: overrides.timestamp ?? '2026-01-15T08:00:00.000Z',
    browserInfo: overrides.browserInfo ?? {
      userAgent: 'Mozilla/5.0 LegacyBrowser',
      viewport: { width: 1024, height: 768 },
      platform: 'MacIntel',
    },
    screenshot: overrides.screenshot,
    htmlSnippet: overrides.htmlSnippet,
    // Intentionally omitting type, severity, elementSelector
  };
}

function createSidebar(container: HTMLElement, feedbacks: Feedback[]) {
  return new ManagerSidebar(container, {
    feedbacks,
    onClose: jest.fn(),
    onDelete: jest.fn(),
    onSaveEdit: jest.fn().mockResolvedValue(undefined),
    onShowExportDialog: jest.fn(),
    onStartCapture: jest.fn(),
    onAnnounce: jest.fn(),
    onLocateElement: jest.fn(),
    currentOrigin: 'https://example.com',
  });
}

// ---------------------------------------------------------------------------
// T-062: Pre-existing feedback renders in sidebar without badge, locate icon, or errors
// ---------------------------------------------------------------------------

describe('T-062: Sidebar rendering of pre-phase-3 feedback', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', href: 'https://example.com/legacy' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    container.remove();
  });

  it('renders card without type badge when type is absent', () => {
    const sidebar = createSidebar(container, [createLegacyFeedback()]);

    const badge = container.querySelector('.fb-type-badge');
    expect(badge).toBeNull();

    const card = container.querySelector('.fb-card');
    expect(card).not.toBeNull();

    sidebar.destroy();
  });

  it('renders card without locate icon when elementSelector is absent', () => {
    const sidebar = createSidebar(container, [createLegacyFeedback()]);

    const locateBtns = container.querySelectorAll('[aria-label="Locate element"]');
    expect(locateBtns.length).toBe(0);

    sidebar.destroy();
  });

  it('renders comment, title, and timestamp correctly', () => {
    const sidebar = createSidebar(container, [createLegacyFeedback()]);

    const card = container.querySelector('.fb-card');
    expect(card).not.toBeNull();

    const title = container.querySelector('.fb-card-title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toBe('OldComponent');

    const comment = container.querySelector('.fb-card-comment');
    expect(comment).not.toBeNull();
    expect(comment!.textContent).toBe('This is legacy feedback from before phase 3');

    const time = container.querySelector('.fb-card-time');
    expect(time).not.toBeNull();

    sidebar.destroy();
  });

  it('renders multiple legacy items without errors', () => {
    const feedbacks = [
      createLegacyFeedback({ id: 'legacy_1', componentName: 'Header' }),
      createLegacyFeedback({ id: 'legacy_2', componentName: 'Footer' }),
      createLegacyFeedback({ id: 'legacy_3', componentName: 'Nav' }),
    ];

    const sidebar = createSidebar(container, feedbacks);

    const cards = container.querySelectorAll('.fb-card');
    expect(cards.length).toBe(3);

    const badges = container.querySelectorAll('.fb-type-badge');
    expect(badges.length).toBe(0);

    const locateBtns = container.querySelectorAll('[aria-label="Locate element"]');
    expect(locateBtns.length).toBe(0);

    sidebar.destroy();
  });

  it('renders mixed legacy and typed feedback without errors', () => {
    const feedbacks = [
      createLegacyFeedback({ id: 'legacy_1', componentName: 'Header' }),
      {
        ...createLegacyFeedback({ id: 'typed_1', componentName: 'Button' }),
        type: 'bug' as const,
        severity: 'major' as const,
        elementSelector: '#submit-btn',
      },
    ];

    const sidebar = createSidebar(container, feedbacks);

    const cards = container.querySelectorAll('.fb-card');
    expect(cards.length).toBe(2);

    // Only the typed feedback should have a badge
    const badges = container.querySelectorAll('.fb-type-badge');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent).toBe('Bug');

    // Only the typed feedback with elementSelector on same origin should have locate icon
    const locateBtns = container.querySelectorAll('[aria-label="Locate element"]');
    expect(locateBtns.length).toBe(1);

    sidebar.destroy();
  });
});

// ---------------------------------------------------------------------------
// T-063: Pre-existing feedback exports identically (no type prefix)
// ---------------------------------------------------------------------------

describe('T-063: Export of pre-phase-3 feedback', () => {
  describe('Markdown export', () => {
    it('produces heading without type prefix for legacy feedback', () => {
      const feedback = createLegacyFeedback();
      const result = MarkdownExporter.exportAsMarkdown([feedback]);

      expect(result).toContain('## 1. OldComponent');
      expect(result).not.toContain('[Bug]');
      expect(result).not.toContain('[Suggestion]');
      expect(result).not.toContain('[Question]');
    });

    it('single item export has no type prefix for legacy feedback', () => {
      const feedback = createLegacyFeedback();
      const result = MarkdownExporter.exportSingleItem(feedback);

      expect(result).toContain('## OldComponent');
      expect(result).not.toContain('[Bug]');
      expect(result).not.toContain('[Suggestion]');
      expect(result).not.toContain('[Question]');
    });

    it('includes all standard fields in export', () => {
      const feedback = createLegacyFeedback();
      const result = MarkdownExporter.exportAsMarkdown([feedback]);

      expect(result).toContain('### Feedback');
      expect(result).toContain('This is legacy feedback from before phase 3');
      expect(result).toContain('### Component Information');
      expect(result).toContain('**Component:** OldComponent');
      expect(result).toContain('**Path:** App > OldComponent');
      expect(result).toContain('**URL:** https://example.com/legacy');
      expect(result).toContain('### Browser Information');
      expect(result).toContain('**Platform:** MacIntel');
    });

    it('mixed legacy and typed feedback exports correctly', () => {
      const legacy = createLegacyFeedback({ id: 'legacy_1', componentName: 'Header' });
      const typed: Feedback = {
        ...createLegacyFeedback({ id: 'typed_1', componentName: 'Button' }),
        type: 'bug',
        severity: 'critical',
      };

      const result = MarkdownExporter.exportAsMarkdown([legacy, typed]);

      // Legacy item: no prefix
      expect(result).toContain('Header');
      // Typed item: has prefix
      expect(result).toContain('[Bug - Critical] Button');
    });
  });

  describe('ZIP export', () => {
    beforeEach(() => {
      mockFile.mockClear();
      mockFolder.mockClear();
      mockGenerateAsync.mockClear();

      mockFolder.mockReturnValue({ file: mockFile });
      mockGenerateAsync.mockResolvedValue(
        new Blob(['zip-content'], { type: 'application/zip' })
      );
    });

    it('produces heading without type prefix in ZIP markdown for legacy feedback', async () => {
      const feedback = createLegacyFeedback();
      await ZipExporter.exportAsZip([feedback]);

      const feedbackMdCall = mockFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'feedback.md'
      );
      expect(feedbackMdCall).toBeDefined();

      const markdown = feedbackMdCall![1] as string;
      expect(markdown).toContain('## 1. OldComponent');
      expect(markdown).not.toContain('[Bug]');
      expect(markdown).not.toContain('[Suggestion]');
      expect(markdown).not.toContain('[Question]');
    });

    it('includes standard fields in ZIP markdown for legacy feedback', async () => {
      const feedback = createLegacyFeedback();
      await ZipExporter.exportAsZip([feedback]);

      const feedbackMdCall = mockFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'feedback.md'
      );
      const markdown = feedbackMdCall![1] as string;

      expect(markdown).toContain('### Feedback');
      expect(markdown).toContain('### Component Information');
      expect(markdown).toContain('**Component:** OldComponent');
    });

    it('ZIP JSON data does not include type/severity/elementSelector when absent', async () => {
      const feedback = createLegacyFeedback();
      await ZipExporter.exportAsZip([feedback]);

      const jsonCall = mockFile.mock.calls.find(
        (call: unknown[]) => call[0] === 'feedback.json'
      );
      expect(jsonCall).toBeDefined();

      const jsonData = JSON.parse(jsonCall![1] as string);
      const item = jsonData.feedbacks[0];

      expect(item.type).toBeUndefined();
      expect(item.severity).toBeUndefined();
      expect(item.elementSelector).toBeUndefined();
    });
  });
});
