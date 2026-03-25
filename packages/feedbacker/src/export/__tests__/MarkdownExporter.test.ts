import { MarkdownExporter } from '../MarkdownExporter';
import type { Feedback } from '../../types';

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb-001',
    componentName: 'LoginButton',
    componentPath: ['App', 'Layout', 'LoginButton'],
    comment: 'Button is misaligned on mobile',
    url: 'https://example.com/login',
    timestamp: '2026-03-20T10:30:00.000Z',
    browserInfo: {
      userAgent: 'Mozilla/5.0 TestBrowser',
      viewport: { width: 1280, height: 720 },
      platform: 'MacIntel'
    },
    ...overrides
  };
}

describe('MarkdownExporter', () => {
  describe('exportAsMarkdown', () => {
    it('returns an empty-state report when given no feedback items', () => {
      // Protects against: missing guard for empty arrays causing header/item generation errors
      const result = MarkdownExporter.exportAsMarkdown([]);

      expect(result).toBe('# Feedback Report\n\nNo feedback items found.\n');
    });

    it('produces a complete markdown document with header and item sections', () => {
      // Protects against: structural regressions in the overall markdown layout (header, summary, item)
      const feedback = makeFeedback();
      const result = MarkdownExporter.exportAsMarkdown([feedback]);

      expect(result).toContain('# Feedback Report');
      expect(result).toContain('## Summary');
      expect(result).toContain('- **Total feedback items:** 1');
      expect(result).toContain('- **Components with feedback:** 1');
      expect(result).toContain('## 1. LoginButton');
      expect(result).toContain('### Feedback');
      expect(result).toContain('### Component Information');
      expect(result).toContain('### Browser Information');
    });

    it('sorts feedback items newest-first', () => {
      // Protects against: incorrect sort order showing stale feedback at the top
      const older = makeFeedback({
        id: 'fb-old',
        componentName: 'OldButton',
        timestamp: '2026-01-01T00:00:00.000Z'
      });
      const newer = makeFeedback({
        id: 'fb-new',
        componentName: 'NewButton',
        timestamp: '2026-03-25T00:00:00.000Z'
      });

      const result = MarkdownExporter.exportAsMarkdown([older, newer]);

      const newIdx = result.indexOf('NewButton');
      const oldIdx = result.indexOf('OldButton');
      expect(newIdx).toBeLessThan(oldIdx);
    });
  });

  describe('generateHeader (via exportAsMarkdown)', () => {
    it('includes the correct total count and unique component count', () => {
      // Protects against: wrong aggregation in summary stats (e.g. counting duplicates as unique)
      const feedbacks = [
        makeFeedback({ id: '1', componentName: 'ButtonA' }),
        makeFeedback({ id: '2', componentName: 'ButtonA' }),
        makeFeedback({ id: '3', componentName: 'ButtonB' })
      ];

      const result = MarkdownExporter.exportAsMarkdown(feedbacks);

      expect(result).toContain('- **Total feedback items:** 3');
      expect(result).toContain('- **Components with feedback:** 2');
    });
  });

  describe('generateFeedbackItem (via exportAsMarkdown)', () => {
    it('renders component name, path, URL, timestamp, and browser info for each item', () => {
      // Protects against: missing or incorrectly formatted fields in exported items
      const feedback = makeFeedback({
        componentPath: ['Root', 'Page', 'Widget'],
        url: 'https://app.test/page',
        timestamp: '2026-06-15T08:00:00.000Z',
        browserInfo: {
          userAgent: 'TestAgent/1.0',
          viewport: { width: 800, height: 600 },
          platform: 'Linux'
        }
      });

      const result = MarkdownExporter.exportAsMarkdown([feedback]);

      expect(result).toContain('- **Component:** LoginButton');
      expect(result).toContain('- **Path:** Root > Page > Widget');
      expect(result).toContain('- **URL:** https://app.test/page');
      expect(result).toContain('- **Timestamp:** 2026-06-15T08:00:00.000Z');
      expect(result).toContain('- **Platform:** Linux');
      expect(result).toContain('- **Viewport:** 800 x 600');
      expect(result).toContain('- **User Agent:** TestAgent/1.0');
    });

    it('includes HTML snippet when provided', () => {
      // Protects against: optional htmlSnippet being silently dropped from export
      const feedback = makeFeedback({ htmlSnippet: '<button class="login">Sign In</button>' });

      const result = MarkdownExporter.exportAsMarkdown([feedback]);

      expect(result).toContain('### HTML Snippet');
      expect(result).toContain('<button class="login">Sign In</button>');
    });

    it('includes metadata block when provided', () => {
      // Protects against: metadata section missing or malformed JSON in output
      const feedback = makeFeedback({ metadata: { priority: 'high', sprint: 42 } });

      const result = MarkdownExporter.exportAsMarkdown([feedback]);

      expect(result).toContain('### Additional Metadata');
      expect(result).toContain('"priority": "high"');
      expect(result).toContain('"sprint": 42');
    });
  });

  describe('formatComment (via exportAsMarkdown)', () => {
    it('escapes markdown special characters in user comments', () => {
      // Protects against: user-supplied markdown chars breaking report formatting
      const feedback = makeFeedback({
        comment: 'Use **bold** and _italic_ with `code` and ~strike~ and \\slash'
      });

      const result = MarkdownExporter.exportAsMarkdown([feedback]);

      const feedbackSection = result.split('### Feedback')[1].split('###')[0];
      expect(feedbackSection).not.toContain('**bold**');
      expect(feedbackSection).toContain('\\*');
      expect(feedbackSection).toContain('\\_');
      expect(feedbackSection).toContain('\\`');
      expect(feedbackSection).toContain('\\~');
      expect(feedbackSection).toContain('\\\\');
    });
  });

  describe('generateFilename', () => {
    it('produces a filename with the current date and item count', () => {
      // Protects against: filename format deviating from expected pattern used by consumers
      const feedbacks = [makeFeedback(), makeFeedback({ id: 'fb-002' })];

      const filename = MarkdownExporter.generateFilename(feedbacks);

      // Format: feedback_YYYY-MM-DD_Nitems.md
      expect(filename).toMatch(/^feedback_\d{4}-\d{2}-\d{2}_2items\.md$/);
    });
  });

  describe('downloadMarkdown', () => {
    it('creates a blob URL, triggers a click on an anchor element, then cleans up', () => {
      // Protects against: download flow not executing all steps (create, click, remove, revoke)
      const mockUrl = 'blob:http://localhost/fake-uuid';
      const createObjectURL = jest.fn().mockReturnValue(mockUrl);
      const revokeObjectURL = jest.fn();
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;

      const clickSpy = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        click: clickSpy
      } as unknown as HTMLAnchorElement;

      const appendChildSpy = jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation((node) => node);
      const removeChildSpy = jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation((node) => node);
      jest
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      const feedbacks = [makeFeedback()];
      MarkdownExporter.downloadMarkdown(feedbacks, 'report.md');

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toBe('report.md');
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });

  describe('sanitizeFilename', () => {
    it('replaces special characters and whitespace, and truncates to 200 chars', () => {
      // Protects against: unsafe filenames with special chars or excessive length
      expect(MarkdownExporter.sanitizeFilename('my report!@#$.md')).toBe('my_report.md');
      expect(MarkdownExporter.sanitizeFilename('a  b   c')).toBe('a_b_c');

      const longName = 'x'.repeat(250) + '.md';
      expect(MarkdownExporter.sanitizeFilename(longName).length).toBe(200);
    });
  });
});
