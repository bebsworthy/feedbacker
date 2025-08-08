/**
 * FeedbackModal Component
 * Main modal for collecting feedback with minimize/restore functionality
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 9.5
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ComponentInfo, Draft } from '../../types';
import { MinimizedState } from './MinimizedState';
import styles from '../../styles/feedbacker.module.css';

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

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
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
  }, [handleSubmit, handleCancel]);

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

  return (
    <>
      {/* Modal backdrop */}
      <div 
        className={`${styles['feedbacker-modal-backdrop']} ${styles.visible}`}
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div 
        className={`${styles['feedbacker-modal']} ${isMobile ? styles['feedbacker-modal-mobile'] : ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="feedback-modal-title"
        aria-describedby="feedback-modal-description"
      >
        {/* Header */}
        <div className={styles['feedbacker-modal-header']}>
          <div>
            <h2 id="feedback-modal-title" className={styles['feedbacker-modal-title']}>
              Feedback for {componentName}
            </h2>
            {componentPath && (
              <div className={styles['component-path']} title={componentPath}>
                {componentPath}
              </div>
            )}
          </div>
          
          <div className={styles['modal-header-actions']}>
            {/* Minimize button */}
            <button
              type="button"
              className={`${styles['feedbacker-button']} ${styles['feedbacker-button-secondary']}`}
              onClick={onMinimize}
              title="Minimize"
              aria-label="Minimize feedback modal"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path 
                  d="M4 8h8" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                />
              </svg>
            </button>
            
            {/* Close button */}
            <button
              type="button"
              className={styles['feedbacker-modal-close']}
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
        <div className={styles['feedbacker-modal-body']}>
          {/* Screenshot preview */}
          {screenshot && (
            <div className={styles['screenshot-preview']}>
              <img 
                src={screenshot} 
                alt="Component screenshot"
                className={styles['screenshot-image']}
              />
            </div>
          )}
          
          {/* Comment textarea */}
          <div className={styles['form-group']}>
            <label htmlFor="feedback-comment" className={styles['form-label']}>
              Your feedback:
            </label>
            <textarea
              id="feedback-comment"
              ref={textareaRef}
              className={styles['feedbacker-textarea']}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the issue or suggestion..."
              rows={6}
              aria-describedby="feedback-modal-description"
            />
            <div id="feedback-modal-description" className={styles['form-help']}>
              {isDirty && (
                <span className={styles['draft-indicator']}>
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
        <div className={styles['feedbacker-modal-footer']}>
          <button
            type="button"
            className={`${styles['feedbacker-button']} ${styles['feedbacker-button-secondary']}`}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles['feedbacker-button']} ${styles['feedbacker-button-primary']}`}
            onClick={handleSubmit}
            disabled={!comment.trim()}
          >
            Submit Feedback
          </button>
        </div>
      </div>

      {/* Draft protection warning */}
      {showDraftWarning && (
        <div className={styles['draft-warning-overlay']}>
          <div className={styles['draft-warning-modal']}>
            <h3 className={styles['draft-warning-title']}>
              You have unsaved changes
            </h3>
            <p className={styles['draft-warning-text']}>
              Would you like to keep your draft or discard the changes?
            </p>
            <div className={styles['draft-warning-actions']}>
              <button
                type="button"
                className={`${styles['feedbacker-button']} ${styles['feedbacker-button-danger']}`}
                onClick={handleDiscardDraft}
              >
                Discard
              </button>
              <button
                type="button"
                className={`${styles['feedbacker-button']} ${styles['feedbacker-button-primary']}`}
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