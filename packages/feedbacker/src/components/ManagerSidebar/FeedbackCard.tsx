/**
 * FeedbackCard - Individual feedback card component
 */

import React, { useState } from 'react';
import { Feedback } from '../../types';
import { PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '../../icons';

interface FeedbackCardProps {
  feedback: Feedback;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  onEdit,
  onCopy,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Screenshot */}
      {feedback.screenshot && (
        <div
          style={{
            width: '100%',
            height: '160px',
            backgroundColor: '#f3f4f6',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <img
            src={feedback.screenshot}
            alt={`Screenshot of ${feedback.componentName}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            {formatTime(feedback.timestamp)}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}
      >
        {/* Title */}
        <h4
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {feedback.componentName}
        </h4>

        {/* Comment */}
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: '#6b7280',
            display: '-webkit-box',
            WebkitLineClamp: isExpanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word'
          }}
        >
          {feedback.comment}
        </p>

        {/* Expandable details */}
        {(feedback.componentPath.length > 1 || feedback.htmlSnippet) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 0',
              border: 'none',
              background: 'none',
              color: '#3b82f6',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUpIcon size={12} />
                Hide details
              </>
            ) : (
              <>
                <ChevronDownIcon size={12} />
                Show details
              </>
            )}
          </button>
        )}

        {/* Expanded details */}
        {isExpanded && (
          <div
            style={{
              padding: '8px',
              backgroundColor: '#f9fafb',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#4b5563',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {feedback.componentPath.length > 1 && (
              <div>
                <strong>Path:</strong> {feedback.componentPath.join(' > ')}
              </div>
            )}
            {feedback.url && (
              <div style={{ wordBreak: 'break-all' }}>
                <strong>URL:</strong> {feedback.url}
              </div>
            )}
            {feedback.htmlSnippet && (
              <div>
                <strong>HTML:</strong>
                <pre
                  style={{
                    margin: '4px 0 0 0',
                    padding: '4px',
                    backgroundColor: '#ffffff',
                    borderRadius: '2px',
                    fontSize: '11px',
                    overflow: 'auto',
                    maxHeight: '100px'
                  }}
                >
                  {feedback.htmlSnippet}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '4px',
          justifyContent: 'flex-end'
        }}
      >
        <button
          onClick={onEdit}
          title="Edit feedback"
          style={{
            padding: '6px 10px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#6b7280',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <PencilIcon size={14} />
          Edit
        </button>

        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          style={{
            padding: '6px 10px',
            backgroundColor: copiedToClipboard ? '#10b981' : '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: copiedToClipboard ? '#ffffff' : '#6b7280',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            if (!copiedToClipboard) {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#111827';
            }
          }}
          onMouseLeave={(e) => {
            if (!copiedToClipboard) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = '#6b7280';
            }
          }}
        >
          {copiedToClipboard ? '✓ Copied' : 'Copy'}
        </button>

        <button
          onClick={onDelete}
          title="Delete feedback"
          style={{
            padding: '6px 10px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: '#ef4444',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          <TrashIcon size={14} />
          Delete
        </button>
      </div>
    </div>
  );
};
