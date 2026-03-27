/**
 * T-037, T-038: Markdown exporter type prefix tests
 */
import { MarkdownExporter } from '../markdown-exporter';
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
      platform: 'MacIntel',
    },
    ...overrides,
  };
}

describe('MarkdownExporter type prefix', () => {
  // T-037: Feedback with type: 'bug' exported to Markdown includes "[Bug]" prefix
  it('prepends [Bug] prefix to heading when type is bug', () => {
    const feedback = makeFeedback({ type: 'bug' });
    const result = MarkdownExporter.exportAsMarkdown([feedback]);

    expect(result).toContain('## 1. [Bug] LoginButton');
  });

  it('prepends [Bug - Critical] prefix when type is bug and severity is critical', () => {
    const feedback = makeFeedback({ type: 'bug', severity: 'critical' });
    const result = MarkdownExporter.exportAsMarkdown([feedback]);

    expect(result).toContain('## 1. [Bug - Critical] LoginButton');
  });

  it('prepends [Bug - Major] prefix when type is bug and severity is major', () => {
    const feedback = makeFeedback({ type: 'bug', severity: 'major' });
    const result = MarkdownExporter.exportAsMarkdown([feedback]);

    expect(result).toContain('## 1. [Bug - Major] LoginButton');
  });

  it('prepends [Bug - Minor] prefix when type is bug and severity is minor', () => {
    const feedback = makeFeedback({ type: 'bug', severity: 'minor' });
    const result = MarkdownExporter.exportAsMarkdown([feedback]);

    expect(result).toContain('## 1. [Bug - Minor] LoginButton');
  });

  it('prepends [Suggestion] prefix when type is suggestion', () => {
    const feedback = makeFeedback({ type: 'suggestion' });
    const result = MarkdownExporter.exportAsMarkdown([feedback]);

    expect(result).toContain('## 1. [Suggestion] LoginButton');
  });

  it('prepends [Question] prefix when type is question', () => {
    const feedback = makeFeedback({ type: 'question' });
    const result = MarkdownExporter.exportAsMarkdown([feedback]);

    expect(result).toContain('## 1. [Question] LoginButton');
  });

  // T-038: Feedback with no type field exports identically to pre-phase-3
  it('produces no prefix when type is undefined', () => {
    const feedback = makeFeedback();
    const result = MarkdownExporter.exportAsMarkdown([feedback]);

    expect(result).toContain('## 1. LoginButton');
    expect(result).not.toContain('[');
  });

  it('produces no prefix when type is explicitly undefined', () => {
    const feedback = makeFeedback({ type: undefined });
    const result = MarkdownExporter.exportAsMarkdown([feedback]);

    expect(result).toContain('## 1. LoginButton');
    expect(result).not.toContain('[Bug]');
    expect(result).not.toContain('[Suggestion]');
    expect(result).not.toContain('[Question]');
  });

  it('includes prefix in exportSingleItem output', () => {
    const feedback = makeFeedback({ type: 'bug', severity: 'critical' });
    const result = MarkdownExporter.exportSingleItem(feedback);

    expect(result).toContain('## [Bug - Critical] LoginButton');
  });

  it('exportSingleItem produces no prefix when type is undefined', () => {
    const feedback = makeFeedback();
    const result = MarkdownExporter.exportSingleItem(feedback);

    expect(result).toContain('## LoginButton');
    expect(result).not.toContain('[');
  });
});
