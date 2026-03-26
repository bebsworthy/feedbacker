/**
 * MarkdownExporter - Generates markdown files from feedback data
 */

import { Feedback } from '../types';

export class MarkdownExporter {
  /**
   * Export feedback as markdown string
   */
  public static exportAsMarkdown(feedbacks: Feedback[]): string {
    if (feedbacks.length === 0) {
      return '# Feedback Report\n\nNo feedback items found.\n';
    }

    const sortedFeedbacks = [...feedbacks].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let markdown = this.generateHeader(sortedFeedbacks);
    markdown += '\n\n';
    markdown += this.generateFeedbackItems(sortedFeedbacks);

    return markdown;
  }

  /**
   * Generate download for markdown content
   */
  public static downloadMarkdown(feedbacks: Feedback[], filename: string = 'feedback.md'): void {
    const markdown = this.exportAsMarkdown(feedbacks);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  /**
   * Generate markdown header with summary
   */
  private static generateHeader(feedbacks: Feedback[]): string {
    const timestamp = new Date().toISOString();
    const totalFeedback = feedbacks.length;
    const componentsCount = new Set(feedbacks.map((f) => f.componentName)).size;

    return [
      '# Feedback Report',
      `Generated on ${timestamp}`,
      '',
      '## Summary',
      `- **Total feedback items:** ${totalFeedback}`,
      `- **Components with feedback:** ${componentsCount}`
    ].join('\n');
  }

  /**
   * Generate all feedback items
   */
  private static generateFeedbackItems(feedbacks: Feedback[]): string {
    return feedbacks
      .map((feedback, index) => this.generateFeedbackItem(feedback, index + 1))
      .join('\n\n---\n\n');
  }

  /**
   * Generate a single feedback item
   */
  private static generateFeedbackItem(feedback: Feedback, index: number): string {
    const timestamp = feedback.timestamp;

    let item = `## ${index}. ${feedback.componentName}\n\n`;

    // Feedback Comment
    item += '### Feedback\n';
    item += this.formatComment(feedback.comment);

    // Component Information
    item += '\n\n### Component Information\n';
    item += `- **Component:** ${feedback.componentName}\n`;
    item += `- **Path:** ${feedback.componentPath.join(' > ')}\n`;
    item += `- **URL:** ${feedback.url}\n`;
    item += `- **Timestamp:** ${timestamp}\n`;

    // Browser Information
    item += '\n### Browser Information\n';
    if (feedback.browserInfo.platform) {
      item += `- **Platform:** ${feedback.browserInfo.platform}\n`;
    }
    item += `- **Viewport:** ${feedback.browserInfo.viewport.width} x ${feedback.browserInfo.viewport.height}\n`;
    item += `- **User Agent:** ${feedback.browserInfo.userAgent}\n`;

    // HTML Snippet (if available)
    if (feedback.htmlSnippet) {
      item += '\n### HTML Snippet\n';
      item += '```html\n';
      item += feedback.htmlSnippet;
      item += '\n```\n';
    }

    // Metadata (if available)
    if (feedback.metadata && Object.keys(feedback.metadata).length > 0) {
      item += '\n### Additional Metadata\n';
      item += '```json\n';
      item += JSON.stringify(feedback.metadata, null, 2);
      item += '\n```\n';
    }

    return item;
  }

  /**
   * Format comment text for markdown
   */
  private static formatComment(comment: string): string {
    const escaped = comment
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`');

    return escaped
      .split('\n')
      .map((line) => line.trim())
      .join('\n\n');
  }

  /**
   * Sanitize filename for download
   */
  public static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 200);
  }

  /**
   * Generate suggested filename based on current date and feedback count
   */
  public static generateFilename(feedbacks: Feedback[]): string {
    const date = new Date().toISOString().split('T')[0];
    const count = feedbacks.length;
    return `feedback_${date}_${count}items.md`;
  }
}
