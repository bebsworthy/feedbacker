/**
 * FeedbackModal Component
 * Main modal for collecting feedback with minimize/restore functionality
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 9.5
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComponentInfo, Draft } from '../../types';
import { MinimizedState } from './MinimizedState';

interface FeedbackModalProps {
  isOpen: boolean;
  isMinimized: boolean;
  componentInfo: ComponentInfo | null;
  screenshot: string | null;
  initialComment?: string;
  onSubmit: (comment: string, screenshot?: string) => void;
  onCancel: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  onSaveDraft: (draft: Draft) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  isMinimized,
  componentInfo,
  screenshot,
  initialComment = '',
  onSubmit,
  onCancel,
  onMinimize,
  onRestore,
  onSaveDraft
}) => {
  const [comment, setComment] = useState<string>(initialComment);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showDraftWarning, setShowDraftWarning] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialCommentRef = useRef<string>(initialComment);

  // Detect mobile screen size (Requirement 9.5)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update comment when initialComment prop changes (for editing different feedback)
  useEffect(() => {
    setComment(initialComment);
    initialCommentRef.current = initialComment;
    setIsDirty(false);
  }, [initialComment]);

  // Track dirty state
  useEffect(() => {
    const hasChanges = comment.trim() !== initialCommentRef.current.trim();
    setIsDirty(hasChanges);
  }, [comment]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  // Auto-save draft when changes are made
  useEffect(() => {
    if (isDirty && componentInfo) {
      const saveTimer = setTimeout(() => {
        const draft: Draft = {
          componentInfo,
          comment: comment.trim(),
          screenshot,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onSaveDraft(draft);
      }, 2000); // Save after 2 seconds of no changes

      return () => clearTimeout(saveTimer);
    }
  }, [comment, componentInfo, screenshot, isDirty, onSaveDraft]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = useCallback(() => {
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      // Focus the textarea if comment is empty
      textareaRef.current?.focus();
      return;
    }

    onSubmit(trimmedComment, screenshot || undefined);
    setComment('');
    setIsDirty(false);
    initialCommentRef.current = '';
  }, [comment, screenshot, onSubmit]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setShowDraftWarning(true);
    } else {
      onCancel();
      setComment('');
      setIsDirty(false);
    }
  }, [isDirty, onCancel]);

  const handleDiscardDraft = useCallback(() => {
    setShowDraftWarning(false);
    onCancel();
    setComment('');
    setIsDirty(false);
    initialCommentRef.current = '';
  }, [onCancel]);

  const handleKeepDraft = useCallback(() => {
    setShowDraftWarning(false);
    onMinimize();
  }, [onMinimize]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Submit on Ctrl/Cmd + Enter
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
      }
      // Cancel on Escape
      else if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
    },
    [handleSubmit, handleCancel]
  );

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Render minimized state
  if (isMinimized) {
    return (
      <MinimizedState
        componentInfo={componentInfo}
        hasScreenshot={!!screenshot}
        isDirty={isDirty}
        onRestore={onRestore}
        onDiscard={handleDiscardDraft}
      />
    );
  }

  // Component display name and path
  const componentName = componentInfo?.name || 'Unknown Component';
  const componentPath = componentInfo?.path?.join(' → ') || '';

  if (!isOpen) {
    return null;
  }

  if (isMinimized) {
    return <MinimizedState componentName={componentName} onRestore={onRestore} />;
  }

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="feedbacker-modal-backdrop"
        onClick={handleCancel}
        role="presentation"
        aria-hidden="true"
      />

      {/* Modal */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`feedbacker-modal ${isMobile ? 'feedbacker-modal-mobile' : ''}`}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedbacker-modal-title"
        aria-describedby="feedback-modal-description"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="feedbacker-modal-header">
          <div>
            <h2 id="feedbacker-modal-title" className="feedbacker-modal-title">
              Feedback for {componentName}
            </h2>
            {componentPath && (
              <div
                className="feedbacker-component-path"
                title={componentPath}
                style={{ fontSize: '12px', color: '#6b7280' }}
              >
                {componentPath}
              </div>
            )}
          </div>

          <div className="feedbacker-modal-header-actions" style={{ display: 'flex', gap: '8px' }}>
            {/* Minimize button */}
            <button
              type="button"
              className="feedbacker-btn-icon"
              onClick={onMinimize}
              title="Minimize"
              aria-label="Minimize feedback modal"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Close button */}
            <button
              type="button"
              className="feedbacker-btn-icon"
              onClick={handleCancel}
              aria-label="Close feedback modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="feedbacker-modal-body">
          {/* Screenshot preview */}
          {screenshot && (
            <div style={{ marginBottom: '16px' }}>
              <img
                src={screenshot}
                alt="Component screenshot"
                className="feedbacker-screenshot-preview"
              />
            </div>
          )}

          {/* Comment textarea */}
          <div className="feedbacker-form-group">
            <label htmlFor="feedback-comment" className="feedbacker-label">
              Your feedback:
            </label>
            <textarea
              id="feedback-comment"
              ref={textareaRef}
              className="feedbacker-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the issue or suggestion..."
              rows={6}
              aria-describedby="feedback-modal-description"
            />
            <div
              id="feedback-modal-description"
              style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}
            >
              {isDirty && (
                <span style={{ color: '#10b981' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="6" fill="orange" />
                  </svg>
                  Draft saved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="feedbacker-modal-footer">
          <button
            type="button"
            className={`feedbacker-btn feedbacker-btn-secondary`}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`feedbacker-btn feedbacker-btn-primary`}
            onClick={handleSubmit}
            disabled={!comment.trim()}
          >
            Submit Feedback
          </button>
        </div>
      </div>

      {/* Draft protection warning */}
      {showDraftWarning && (
        <div className="feedbacker-modal-backdrop visible" onClick={handleDiscardDraft}>
          <div
            className="feedbacker-modal"
            style={{ maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '16px' }}>You have unsaved changes</h3>
            <p style={{ marginBottom: '24px', color: '#6b7280' }}>
              Would you like to keep your draft or discard the changes?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className={`feedbacker-btn feedbacker-btn-danger`}
                onClick={handleDiscardDraft}
              >
                Discard
              </button>
              <button
                type="button"
                className={`feedbacker-btn feedbacker-btn-primary`}
                onClick={handleKeepDraft}
              >
                Keep Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
