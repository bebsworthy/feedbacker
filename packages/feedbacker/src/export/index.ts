/**
 * Export module - Handles feedback data export in multiple formats
 */

export { MarkdownExporter } from './MarkdownExporter';
export { ZipExporter } from './ZipExporter';

// Re-export types for convenience
export type { ExportOptions, ExportManager as IExportManager } from '../types';

/**
 * Combined export manager that handles both formats
 */
import { Feedback, ExportOptions } from '../types';
import { MarkdownExporter } from './MarkdownExporter';
import { ZipExporter } from './ZipExporter';

export class ExportManager {
  /**
   * Export feedback in the specified format
   */
  public static async exportFeedback(
    feedbacks: Feedback[], 
    options: ExportOptions
  ): Promise<void> {
    if (feedbacks.length === 0) {
      throw new Error('No feedback items to export');
    }

    try {
      if (options.format === 'markdown') {
        const filename = MarkdownExporter.generateFilename(feedbacks);
        MarkdownExporter.downloadMarkdown(feedbacks, filename);
      } else if (options.format === 'zip') {
        const filename = ZipExporter.generateZipFilename(feedbacks);
        await ZipExporter.downloadZip(feedbacks, filename);
      } else {
        throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('[Feedbacker] Export failed:', error);
      throw error;
    }
  }

  /**
   * Get export format information
   */
  public static getFormatInfo(format: 'markdown' | 'zip') {
    const formats = {
      markdown: {
        name: 'Markdown',
        description: 'Text-only export without images',
        extension: '.md',
        includesImages: false,
        fileSize: 'Small'
      },
      zip: {
        name: 'ZIP Archive',
        description: 'Complete export with images and JSON data',
        extension: '.zip',
        includesImages: true,
        fileSize: 'Larger (includes images)'
      }
    };

    return formats[format] || null;
  }

  /**
   * Estimate export size (rough calculation)
   */
  public static estimateExportSize(feedbacks: Feedback[], format: 'markdown' | 'zip'): string {
    const totalFeedbacks = feedbacks.length;
    const feedbacksWithImages = feedbacks.filter(f => f.screenshot).length;
    
    if (format === 'markdown') {
      // Rough estimate: ~500 bytes per feedback item
      const estimatedBytes = totalFeedbacks * 500;
      return this.formatBytes(estimatedBytes);
    } else {
      // Rough estimate: ~50KB per screenshot + 1KB per feedback
      const estimatedBytes = (feedbacksWithImages * 50 * 1024) + (totalFeedbacks * 1024);
      return this.formatBytes(estimatedBytes);
    }
  }

  /**
   * Format bytes into human-readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}