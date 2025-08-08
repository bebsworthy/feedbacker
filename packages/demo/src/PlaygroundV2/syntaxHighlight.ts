/**
 * Simple syntax highlighting utilities for JSON and Markdown
 */

export const highlightJSON = (json: string): string => {
  // Escape HTML first
  let highlighted = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Add syntax highlighting
  highlighted = highlighted
    // Property names (keys)
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    // String values
    .replace(/: "([^"]*?)"/g, ': <span class="json-string">"$1"</span>')
    // Numbers
    .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
    // Booleans
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    // Null
    .replace(/: (null)/g, ': <span class="json-null">$1</span>')
    // Array/Object brackets
    .replace(/([{}\[\]])/g, '<span class="json-bracket">$1</span>');
  
  return highlighted;
};

export const highlightMarkdown = (markdown: string): string => {
  // Escape HTML first
  let highlighted = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Add syntax highlighting
  highlighted = highlighted
    // Headers
    .replace(/^(#{1,6})\s+(.+)$/gm, '<span class="md-header">$1 $2</span>')
    // Bold text
    .replace(/\*\*([^*]+)\*\*/g, '<span class="md-bold">**$1**</span>')
    // Lists
    .replace(/^(\s*[-*])\s+/gm, '<span class="md-list">$1</span> ')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<span class="md-code-block">\`\`\`${lang || ''}\n${code}\`\`\`</span>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<span class="md-code">`$1`</span>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="md-link">[$1]($2)</span>')
    // Horizontal rules
    .replace(/^---$/gm, '<span class="md-hr">---</span>');
  
  return highlighted;
};