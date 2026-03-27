import { ZipExporter } from '..';
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
    generateAsync: mockGenerateAsync
  }));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: 'fb-abc123def456',
    componentName: 'SubmitButton',
    componentPath: ['App', 'Form', 'SubmitButton'],
    comment: 'Button looks great',
    url: 'https://example.com/form',
    timestamp: '2026-01-15T10:30:00.000Z',
    browserInfo: {
      userAgent: 'Mozilla/5.0 TestBrowser',
      viewport: { width: 1920, height: 1080 },
      platform: 'MacIntel'
    },
    ...overrides
  };
}

const VALID_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

// ---------------------------------------------------------------------------
// exportAsZip
// ---------------------------------------------------------------------------

describe('ZipExporter', () => {
  beforeEach(() => {
    mockFile.mockClear();
    mockFolder.mockClear();
    mockGenerateAsync.mockClear();

    // Default: folder() returns an object with a file method
    mockFolder.mockReturnValue({ file: mockFile });
    mockGenerateAsync.mockResolvedValue(new Blob(['zip-content'], { type: 'application/zip' }));
  });

  describe('exportAsZip', () => {
    it('throws when given an empty feedback array', async () => {
      // Protects against: silently producing an empty/corrupt ZIP from no data
      await expect(ZipExporter.exportAsZip([])).rejects.toThrow('No feedback items to export');
    });

    it('generates a zip blob for a single feedback without screenshot', async () => {
      // Protects against: basic ZIP generation failing for simple feedback
      const feedback = makeFeedback();
      const blob = await ZipExporter.exportAsZip([feedback]);

      expect(blob).toBeInstanceOf(Blob);
      expect(mockFile).toHaveBeenCalledWith('feedback.md', expect.any(String));
      expect(mockFile).toHaveBeenCalledWith('feedback.json', expect.any(String));
      expect(mockFolder).toHaveBeenCalledWith('images');
      expect(mockGenerateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'blob',
          compression: 'DEFLATE'
        })
      );
    });

    it('adds screenshot image to the images folder when feedback has a screenshot', async () => {
      // Protects against: screenshots being silently dropped from the ZIP archive
      const feedback = makeFeedback({ screenshot: VALID_DATA_URL });
      await ZipExporter.exportAsZip([feedback]);

      // The image file() call goes to the folder object returned by folder('images')
      expect(mockFile).toHaveBeenCalledWith(
        expect.stringMatching(/^submitbutton_.*\.png$/),
        'iVBORw0KGgoAAAANSUhEUg==',
        { base64: true }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // generateMarkdownWithImageRefs (tested indirectly via exportAsZip)
  // ---------------------------------------------------------------------------

  describe('markdown generation via exportAsZip', () => {
    it('generates markdown containing component name, comment, and image reference', async () => {
      // Protects against: markdown output missing critical feedback content or image links
      const feedback = makeFeedback({ screenshot: VALID_DATA_URL });
      await ZipExporter.exportAsZip([feedback]);

      const markdownCall = mockFile.mock.calls.find((call: unknown[]) => call[0] === 'feedback.md');
      expect(markdownCall).toBeDefined();
      const markdown: string = markdownCall![1];

      expect(markdown).toContain('# Feedback Report');
      expect(markdown).toContain('SubmitButton');
      expect(markdown).toContain('Button looks great');
      expect(markdown).toContain('![Screenshot of SubmitButton](images/');
    });

    it('generates markdown without image reference when no screenshot exists', async () => {
      // Protects against: broken image references appearing when no screenshot was captured
      const feedback = makeFeedback({ screenshot: undefined });
      await ZipExporter.exportAsZip([feedback]);

      const markdownCall = mockFile.mock.calls.find((call: unknown[]) => call[0] === 'feedback.md');
      const markdown: string = markdownCall![1];

      expect(markdown).not.toContain('![Screenshot');
      expect(markdown).toContain('**Screenshots included:** 0');
    });
  });

  // ---------------------------------------------------------------------------
  // extractImageData (tested indirectly via exportAsZip image addition)
  // ---------------------------------------------------------------------------

  describe('image extraction via exportAsZip', () => {
    it('extracts base64 payload from a valid data URL', async () => {
      // Protects against: regex failing to parse standard data URL format
      const feedback = makeFeedback({ screenshot: VALID_DATA_URL });
      await ZipExporter.exportAsZip([feedback]);

      // Verify the extracted base64 string (without the data URL prefix) was passed to file()
      expect(mockFile).toHaveBeenCalledWith(expect.any(String), 'iVBORw0KGgoAAAANSUhEUg==', {
        base64: true
      });
    });

    it('does not add an image file when screenshot is an invalid data URL', async () => {
      // Protects against: corrupt data being written to the ZIP for malformed screenshots
      const feedback = makeFeedback({ screenshot: 'not-a-data-url' });
      await ZipExporter.exportAsZip([feedback]);

      // The file() call with base64 option should NOT have been made
      const base64Calls = mockFile.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[2] === 'object' && (call[2] as Record<string, unknown>).base64 === true
      );
      expect(base64Calls).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // generateZipFilename
  // ---------------------------------------------------------------------------

  describe('generateZipFilename', () => {
    it('returns filename with date and item count', () => {
      // Protects against: malformed filenames breaking download or losing context
      const feedbacks = [makeFeedback(), makeFeedback({ id: 'fb-second000002' })];

      const filename = ZipExporter.generateZipFilename(feedbacks);

      // Format: feedback_YYYY-MM-DD_Nitems.zip
      expect(filename).toMatch(/^feedback_\d{4}-\d{2}-\d{2}_2items\.zip$/);
    });
  });

  // ---------------------------------------------------------------------------
  // downloadZip
  // ---------------------------------------------------------------------------

  describe('downloadZip', () => {
    it('creates a temporary link, triggers click, then cleans up', async () => {
      // Protects against: download not triggering or URL object leaking memory
      const mockClick = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      } as unknown as HTMLAnchorElement;

      const createElementSpy = jest
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as any);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockReturnValue(mockLink);
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockReturnValue(mockLink);

      // jsdom does not define URL.createObjectURL/revokeObjectURL, so assign directly
      const mockCreateObjectURL = jest.fn().mockReturnValue('blob:http://localhost/fake-url');
      const mockRevokeObjectURL = jest.fn();
      URL.createObjectURL = mockCreateObjectURL;
      URL.revokeObjectURL = mockRevokeObjectURL;

      const feedback = makeFeedback();
      await ZipExporter.downloadZip([feedback], 'custom.zip');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect((mockLink as any).download).toBe('custom.zip');
      expect(mockClick).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-url');
    });
  });
});
