/**
 * FeedbackList - Component to display list of feedback items
 *
 * Features:
 * - Thumbnail preview for each feedback
 * - Expandable details view
 * - Edit and delete actions
 * - Responsive design
 */

import React, { useState } from 'react';
import { Feedback } from '../../types';
import { formatDistanceToNow } from '../../utils/dateUtils';
import {
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ComputerDesktopIcon
} from '../../icons';

interface FeedbackListProps {
  feedbacks: Feedback[];
  onEdit: (feedback: Feedback) => void;
  onDelete: (feedback: Feedback) => void;
}

interface FeedbackItemProps {
  feedback: Feedback;
  onEdit: (feedback: Feedback) => void;
  onDelete: (feedback: Feedback) => void;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ feedback, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = () => {
    onEdit(feedback);
  };

  const handleDelete = () => {
    onDelete(feedback);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="feedback-item">
      <div className="feedback-item-header" onClick={handleToggleExpanded}>
        {/* Thumbnail */}
        <div className="feedback-thumbnail">
          {feedback.screenshot && !imageError ? (
            <img
              src={feedback.screenshot}
              alt={`Screenshot for ${feedback.componentName}`}
              onError={handleImageError}
              className="thumbnail-image"
            />
          ) : (
            <div className="thumbnail-placeholder">
              <ComputerDesktopIcon />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="feedback-content">
          <div className="feedback-meta">
            <span className="component-name">{feedback.componentName}</span>
            <span className="feedback-time">
              {formatDistanceToNow(new Date(feedback.timestamp))}
            </span>
          </div>

          <div className="feedback-path">{feedback.componentPath.join(' > ')}</div>

          <div className="feedback-comment-preview">{truncateText(feedback.comment)}</div>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="feedback-expand">
          {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="feedback-item-expanded">
          {/* Full Screenshot */}
          {feedback.screenshot && !imageError && (
            <div className="feedback-screenshot-full">
              <img
                src={feedback.screenshot}
                alt={`Full screenshot for ${feedback.componentName}`}
                className="screenshot-full-image"
              />
            </div>
          )}

          {/* Full Comment */}
          <div className="feedback-comment-full">
            <h4 className="feedback-comment-title">Comment</h4>
            <p className="feedback-comment-text">{feedback.comment}</p>
          </div>

          {/* Metadata */}
          <div className="feedback-metadata">
            <h4 className="feedback-metadata-title">Details</h4>
            <div className="feedback-metadata-grid">
              <div className="metadata-item">
                <span className="metadata-label">URL:</span>
                <span className="metadata-value">{feedback.url}</span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Browser:</span>
                <span className="metadata-value">
                  {feedback.browserInfo.platform} - {feedback.browserInfo.viewport.width}x
                  {feedback.browserInfo.viewport.height}
                </span>
              </div>
              <div className="metadata-item">
                <span className="metadata-label">Timestamp:</span>
                <span className="metadata-value">
                  {new Date(feedback.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="feedback-actions">
            <button
              className="feedbacker-btn feedbacker-btn-secondary"
              onClick={handleEdit}
              title="Edit feedback"
            >
              <PencilIcon />
              Edit
            </button>
            <button
              className="feedbacker-btn feedbacker-btn-danger"
              onClick={handleDelete}
              title="Delete feedback"
            >
              <TrashIcon />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const FeedbackList: React.FC<FeedbackListProps> = ({ feedbacks, onEdit, onDelete }) => {
  if (feedbacks.length === 0) {
    return (
      <div className="feedback-list-empty">
        <PhotoIcon size={48} />
        <h3>No feedback yet</h3>
        <p>Click &quot;New feedback&quot; to get started!</p>
      </div>
    );
  }

  return (
    <div className="feedback-list">
      {feedbacks.map((feedback) => (
        <FeedbackItem key={feedback.id} feedback={feedback} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};
