/**
 * ZipExporter - Creates ZIP archives with feedback data and images
 * 
 * Features:
 * - Full ZIP export with feedback.md, feedback.json, and images/ folder
 * - Image extraction to separate files
 * - Proper file structure
 * - Base64 image handling
 */

import JSZip from 'jszip';
import { Feedback } from '../types';

export class ZipExporter {
  /**
   * Export feedback as ZIP archive
   */
  public static async exportAsZip(feedbacks: Feedback[]): Promise<Blob> {
    if (feedbacks.length === 0) {
      throw new Error('No feedback items to export');
    }

    const zip = new JSZip();

    // Add feedback.md (markdown with image references)
    const markdown = this.generateMarkdownWithImageRefs(feedbacks);
    zip.file('feedback.md', markdown);

    // Add feedback.json (complete data with base64 images)
    const jsonData = this.generateJsonData(feedbacks);
    zip.file('feedback.json', JSON.stringify(jsonData, null, 2));

    // Add images folder with extracted images
    const imagesFolder = zip.folder('images');
    if (!imagesFolder) {
      throw new Error('Failed to create images folder');
    }

    // Extract and add images
    await this.addImagesToZip(feedbacks, imagesFolder);

    // Generate the ZIP file
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6 // Good balance between compression and speed
      }
    });
  }

  /**
   * Generate and download ZIP file
   */
  public static async downloadZip(feedbacks: Feedback[], filename?: string): Promise<void> {
    try {
      const zipBlob = await this.exportAsZip(feedbacks);
      const url = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || this.generateZipFilename(feedbacks);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[Feedbacker] ZIP export failed:', error);
      throw new Error('Failed to generate ZIP export');
    }
  }

  /**
   * Generate markdown with image references instead of base64
   */
  private static generateMarkdownWithImageRefs(feedbacks: Feedback[]): string {
    if (feedbacks.length === 0) {
      return '# Feedback Report\n\nNo feedback items found.\n';
    }

    const sortedFeedbacks = [...feedbacks].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    let markdown = this.generateHeaderWithImages(sortedFeedbacks);
    markdown += '\n\n';
    markdown += this.generateFeedbackItemsWithImages(sortedFeedbacks);

    return markdown;
  }

  /**
   * Generate header for ZIP markdown
   */
  private static generateHeaderWithImages(feedbacks: Feedback[]): string {
    const timestamp = new Date().toISOString();
    const totalFeedback = feedbacks.length;
    const componentsCount = new Set(feedbacks.map(f => f.componentName)).size;
    const imagesCount = feedbacks.filter(f => f.screenshot).length;
    
    return [
      '# Feedback Report',
      `Generated on ${timestamp}`,
      '',
      '## Summary',
      `- **Total feedback items:** ${totalFeedback}`,
      `- **Components with feedback:** ${componentsCount}`,
      `- **Screenshots included:** ${imagesCount}`
    ].join('\n');
  }


  /**
   * Generate feedback items with image references
   */
  private static generateFeedbackItemsWithImages(feedbacks: Feedback[]): string {
    return feedbacks.map((feedback, index) => 
      this.generateFeedbackItemWithImages(feedback, index + 1)
    ).join('\n\n---\n\n');
  }

  /**
   * Generate single feedback item with image references
   */
  private static generateFeedbackItemWithImages(feedback: Feedback, index: number): string {
    const timestamp = feedback.timestamp; // Already in ISO format
    
    let item = `## ${index}. ${feedback.componentName}\n\n`;
    
    // Screenshot FIRST (if available)
    if (feedback.screenshot) {
      const imageName = this.generateImageName(feedback);
      item += `![Screenshot of ${feedback.componentName}](images/${imageName})\n\n`;
    }
    
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
   * Generate JSON data with image paths instead of embedded data
   */
  private static generateJsonData(feedbacks: Feedback[]): any {
    return {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Feedbacker Library',
        version: '1.0.0',
        format: 'Full ZIP Export',
        totalItems: feedbacks.length,
        itemsWithScreenshots: feedbacks.filter(f => f.screenshot).length
      },
      feedbacks: feedbacks.map(feedback => {
        const result: any = {
          ...feedback,
          screenshot: undefined  // Remove embedded screenshot
        };
        
        // Add exportedImagePath if screenshot exists
        if (feedback.screenshot) {
          result.exportedImagePath = `images/${this.generateImageName(feedback)}`;
        }
        
        // Remove the screenshot property entirely
        delete result.screenshot;
        
        return result;
      })
    };
  }

  /**
   * Add images to ZIP archive
   */
  private static async addImagesToZip(feedbacks: Feedback[], imagesFolder: JSZip): Promise<void> {
    const imagePromises = feedbacks
      .filter(feedback => feedback.screenshot)
      .map(async (feedback) => {
        const imageName = this.generateImageName(feedback);
        const imageData = this.extractImageData(feedback.screenshot!);
        
        if (imageData) {
          imagesFolder.file(imageName, imageData, { base64: true });
        }
      });

    await Promise.all(imagePromises);
  }

  /**
   * Extract base64 image data from data URL
   */
  private static extractImageData(dataUrl: string): string | null {
    try {
      // Data URL format: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
      const matches = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
      return matches ? matches[1] : null;
    } catch (error) {
      console.error('[Feedbacker] Failed to extract image data:', error);
      return null;
    }
  }

  /**
   * Generate image filename for a feedback item
   */
  private static generateImageName(feedback: Feedback): string {
    // Use component name + timestamp + short ID for unique filename
    const componentName = feedback.componentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 20);
    
    const timestamp = new Date(feedback.timestamp)
      .toISOString()
      .replace(/[:.]/g, '')
      .substring(0, 15); // YYYYMMDDTHHMMSS
    
    const shortId = feedback.id.slice(-6);
    
    // Determine image extension from data URL
    let extension = 'png'; // default
    if (feedback.screenshot?.includes('data:image/jpeg')) {
      extension = 'jpg';
    } else if (feedback.screenshot?.includes('data:image/webp')) {
      extension = 'webp';
    }
    
    return `${componentName}_${timestamp}_${shortId}.${extension}`;
  }

  /**
   * Format comment for markdown
   */
  private static formatComment(comment: string): string {
    // Escape markdown special characters
    const escaped = comment
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`');
    
    return escaped
      .split('\n')
      .map(line => line.trim())
      .join('\n\n');
  }

  /**
   * Generate markdown anchor
   */
  private static generateAnchor(componentName: string, id: string): string {
    const base = componentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const shortId = id.slice(-8);
    return `${base}-${shortId}`;
  }


  /**
   * Generate ZIP filename
   */
  public static generateZipFilename(feedbacks: Feedback[]): string {
    const date = new Date().toISOString().split('T')[0];
    const count = feedbacks.length;
    return `feedback_${date}_${count}items.zip`;
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
}