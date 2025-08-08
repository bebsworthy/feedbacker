/**
 * FeedbackPanel - Displays captured feedback in JSON and Markdown formats
 */

import React, { useState } from 'react';
import { useFeedback } from '@feedbacker/core';
import { Feedback } from '@feedbacker/core';
import { highlightJSON, highlightMarkdown } from './syntaxHighlight';

interface FeedbackPanelProps {
  className?: string;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'json' | 'markdown'>('json');
  
  // Use the feedback hook properly
  const feedbackData = useFeedback();
  const feedbackList = feedbackData?.feedbacks || [];
  const clearAllFeedback = feedbackData?.clearAll;

  // No need for separate state - use feedbackList directly

  const formatJSON = (feedback: Feedback[]): string => {
    if (feedback.length === 0) {
      return '{\n  "feedback": [],\n  "message": "No feedback captured yet. Click on components in feedback mode to capture data."\n}';
    }
    return JSON.stringify(feedback, null, 2);
  };

  const formatMarkdown = (feedback: Feedback[]): string => {
    if (feedback.length === 0) {
      return '# No Feedback Captured\n\nActivate feedback mode and click on components to capture feedback.';
    }

    return feedback.map((item, index) => {
      const componentInfo = item.componentInfo;
      const browserInfo = item.browserInfo;
      
      return `## Feedback #${index + 1}

### Component Information
- **Component:** ${componentInfo?.name || 'Unknown'}
- **Path:** ${componentInfo?.path?.join(' > ') || 'N/A'}
- **Timestamp:** ${new Date(item.timestamp).toLocaleString()}

### Feedback
${item.comment || 'No comment provided'}

### Browser Information
- **URL:** ${browserInfo?.url || 'N/A'}
- **Viewport:** ${browserInfo?.viewport.width}x${browserInfo?.viewport.height}
- **User Agent:** ${browserInfo?.userAgent || 'N/A'}

${item.htmlSnippet ? `### HTML Snippet\n\`\`\`html\n${item.htmlSnippet}\n\`\`\`` : ''}

---
`;
    }).join('\n');
  };

  const handleClear = () => {
    if (clearAllFeedback) {
      clearAllFeedback();
    }
  };

  return (
    <div className={`feedback-panel ${className || ''}`}>
      <div className="feedback-panel-header">
        <h3>Captured Feedback</h3>
        <div className="feedback-panel-controls">
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              JSON
            </button>
            <button 
              className={`tab-btn ${activeTab === 'markdown' ? 'active' : ''}`}
              onClick={() => setActiveTab('markdown')}
            >
              Markdown
            </button>
          </div>
          <button 
            className="clear-btn"
            onClick={handleClear}
            disabled={feedbackList.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="feedback-panel-content">
        {activeTab === 'json' ? (
          <pre className="code-display json-display">
            <code dangerouslySetInnerHTML={{ __html: highlightJSON(formatJSON(feedbackList)) }} />
          </pre>
        ) : (
          <pre className="code-display markdown-display">
            <code dangerouslySetInnerHTML={{ __html: highlightMarkdown(formatMarkdown(feedbackList)) }} />
          </pre>
        )}
      </div>

      {feedbackList.length > 0 && (
        <div className="feedback-panel-footer">
          <span className="feedback-count">
            {feedbackList.length} feedback item{feedbackList.length !== 1 ? 's' : ''} captured
          </span>
        </div>
      )}
    </div>
  );
};