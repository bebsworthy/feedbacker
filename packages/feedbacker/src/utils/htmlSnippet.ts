/**
 * HTML Snippet utility
 * Captures the first and last few lines of an element's outerHTML
 */

/**
 * Capture HTML snippet showing first and last lines of element
 */
export function captureHtmlSnippet(element: HTMLElement, linesCount: number = 3): string {
  try {
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove script tags and style tags for cleaner output
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    
    // Get the outerHTML and format it
    const outerHTML = clone.outerHTML;
    
    // Pretty format the HTML
    const formatted = prettifyHtml(outerHTML);
    const lines = formatted.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length <= linesCount * 2) {
      // If total lines are less than or equal to what we want to show, return all
      return lines.join('\n');
    }
    
    // Get first N lines and last N lines
    const firstLines = lines.slice(0, linesCount);
    const lastLines = lines.slice(-linesCount);
    
    // Combine with ellipsis in between
    return [
      ...firstLines,
      '  ...',
      ...lastLines
    ].join('\n');
  } catch (error) {
    console.error('[Feedbacker] Failed to capture HTML snippet:', error);
    return '';
  }
}

/**
 * Pretty print HTML with proper indentation
 */
function prettifyHtml(html: string): string {
  try {
    let formatted = '';
    let indent = 0;
    
    // Add newlines and indentation
    html = html
      // Add newline before opening tags
      .replace(/(<[^\/][^>]*>)/g, '\n$1')
      // Add newline after closing tags
      .replace(/(<\/[^>]+>)/g, '$1\n')
      // Remove empty lines
      .replace(/\n\s*\n/g, '\n');
    
    const lines = html.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Closing tag - decrease indent before
      if (trimmed.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }
      
      // Add the indented line
      formatted += '  '.repeat(indent) + trimmed + '\n';
      
      // Opening tag (not self-closing) - increase indent after
      if (trimmed.startsWith('<') && 
          !trimmed.startsWith('</') && 
          !trimmed.endsWith('/>') && 
          !trimmed.includes('</')) {
        // Check if it's not a void element
        const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        const tagName = trimmed.match(/<([a-zA-Z0-9]+)/)?.[1]?.toLowerCase();
        if (!voidElements.includes(tagName || '')) {
          indent++;
        }
      }
    }
    
    return formatted.trim();
  } catch (error) {
    console.error('[Feedbacker] Failed to prettify HTML:', error);
    return html;
  }
}

/**
 * Format HTML snippet for better readability
 */
export function formatHtmlSnippet(html: string): string {
  try {
    // The HTML is already formatted by captureHtmlSnippet
    // Just ensure consistent indentation for the ellipsis
    const lines = html.split('\n');
    
    return lines.map(line => {
      // Keep ellipsis centered without indentation
      if (line.trim() === '...') {
        return '\n  ...\n';
      }
      return line;
    }).join('\n').trim();
  } catch (error) {
    // If formatting fails, return original
    return html;
  }
}