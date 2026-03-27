/**
 * T-039, T-040: ZIP exporter type prefix tests
 *
 * We mock JSZip and capture the markdown content passed to zip.file('feedback.md', ...)
 * to verify type prefixes without needing real ZIP extraction.
 */
import type { Feedback } from '../../types';

// ---------------------------------------------------------------------------
// JSZip mock
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

// Must import after mock
import { ZipExporter } from '../zip-exporter';

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb-001',
    componentName: 'SearchBar',
    componentPath: ['App', 'Header', 'SearchBar'],
    comment: 'Search results are slow to load',
    url: 'https://example.com/search',
    timestamp: '2026-03-20T10:30:00.000Z',
    browserInfo: {
      userAgent: 'Mozilla/5.0 TestBrowser',
      viewport: { width: 1280, height: 720 },
      platform: 'MacIntel',
    },
    ...overrides,
  };
}

/**
 * Extract the markdown string that was passed to zip.file('feedback.md', ...).
 */
function getCapturedMarkdown(): string {
  const feedbackMdCall = mockFile.mock.calls.find(
    (call: unknown[]) => call[0] === 'feedback.md'
  );
  if (!feedbackMdCall) throw new Error('feedback.md was not written to the ZIP');
  return feedbackMdCall[1] as string;
}

describe('ZipExporter type prefix', () => {
  beforeEach(() => {
    mockFile.mockClear();
    mockFolder.mockClear();
    mockGenerateAsync.mockClear();

    mockFolder.mockReturnValue({ file: mockFile });
    mockGenerateAsync.mockResolvedValue(
      new Blob(['zip-content'], { type: 'application/zip' })
    );
  });

  // T-039: Feedback with type: 'question' exported in ZIP markdown includes "[Question]" prefix
  it('prepends [Question] prefix to heading when type is question', async () => {
    const feedback = makeFeedback({ type: 'question' });
    await ZipExporter.exportAsZip([feedback]);

    const markdown = getCapturedMarkdown();
    expect(markdown).toContain('## 1. [Question] SearchBar');
  });

  // T-040: Feedback with type: 'bug' and severity: 'critical' includes "[Bug - Critical]" prefix
  it('prepends [Bug - Critical] prefix when type is bug and severity is critical', async () => {
    const feedback = makeFeedback({ type: 'bug', severity: 'critical' });
    await ZipExporter.exportAsZip([feedback]);

    const markdown = getCapturedMarkdown();
    expect(markdown).toContain('## 1. [Bug - Critical] SearchBar');
  });

  it('prepends [Bug] prefix when type is bug without severity', async () => {
    const feedback = makeFeedback({ type: 'bug' });
    await ZipExporter.exportAsZip([feedback]);

    const markdown = getCapturedMarkdown();
    expect(markdown).toContain('## 1. [Bug] SearchBar');
  });

  it('prepends [Suggestion] prefix when type is suggestion', async () => {
    const feedback = makeFeedback({ type: 'suggestion' });
    await ZipExporter.exportAsZip([feedback]);

    const markdown = getCapturedMarkdown();
    expect(markdown).toContain('## 1. [Suggestion] SearchBar');
  });

  it('produces no prefix when type is undefined (backward compat)', async () => {
    const feedback = makeFeedback();
    await ZipExporter.exportAsZip([feedback]);

    const markdown = getCapturedMarkdown();
    expect(markdown).toContain('## 1. SearchBar');
    expect(markdown).not.toMatch(/\[Bug\]/);
    expect(markdown).not.toMatch(/\[Suggestion\]/);
    expect(markdown).not.toMatch(/\[Question\]/);
  });

  it('produces no prefix when type is explicitly undefined', async () => {
    const feedback = makeFeedback({ type: undefined });
    await ZipExporter.exportAsZip([feedback]);

    const markdown = getCapturedMarkdown();
    expect(markdown).toContain('## 1. SearchBar');
    expect(markdown).not.toContain('[Bug]');
    expect(markdown).not.toContain('[Suggestion]');
    expect(markdown).not.toContain('[Question]');
  });
});
