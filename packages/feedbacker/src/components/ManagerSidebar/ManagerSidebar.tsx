/**
 * ManagerSidebar - Feedback management sidebar component
 *
 * Features:
 * - Slide animation from right
 * - Feedback list with thumbnails
 * - Edit/delete functionality
 * - Clear all with confirmation
 * - Outside click to close
 */

import React, { useState, useRef, useEffect } from 'react';
import { Feedback } from '../../types';
import { FeedbackList } from './FeedbackList';
import { ConfirmDialog } from './ConfirmDialog';
import { ExportDialog } from './ExportDialog';
import { TrashIcon, XMarkIcon, ArrowDownTrayIcon } from '../../icons';

interface ManagerSidebarProps {
  isOpen: boolean;
  feedbacks: Feedback[];
  onClose: () => void;
  onDeleteFeedback: (id: string) => void;
  onEditFeedback: (feedback: Feedback) => void;
  onClearAll: () => void;
  onExport: (format: 'markdown' | 'zip') => void;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  isDanger?: boolean;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({
  isOpen,
  feedbacks,
  onClose,
  onDeleteFeedback,
  onEditFeedback,
  onClearAll,
  onExport
}) => {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [exportDialog, setExportDialog] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close sidebar
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is on the backdrop (not the sidebar itself)
      if (backdropRef.current?.contains(target) && !sidebarRef.current?.contains(target)) {
        onClose();
      }
    };

    // Small delay to prevent immediate close on opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleDeleteConfirm = (feedback: Feedback) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Feedback',
      message: `Are you sure you want to delete feedback for "${feedback.componentName}"? This action cannot be undone.`,
      onConfirm: () => {
        onDeleteFeedback(feedback.id);
        setConfirmDialog(null);
      },
      isDanger: true
    });
  };

  const handleClearAllConfirm = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear All Feedback',
      message: `Are you sure you want to delete all ${feedbacks.length} feedback items? This action cannot be undone.`,
      onConfirm: () => {
        onClearAll();
        setConfirmDialog(null);
      },
      isDanger: true
    });
  };

  const handleExportClick = () => {
    setExportDialog(true);
  };

  const handleExportFormat = (format: 'markdown' | 'zip') => {
    setExportDialog(false);
    onExport(format);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="feedbacker-root">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="feedbacker-modal-backdrop visible"
        style={{ zIndex: 99999 }}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`feedbacker-sidebar ${isOpen ? 'open' : ''}`}
        style={{ zIndex: 100000 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        {/* Header */}
        <div className="feedbacker-modal-header">
          <div>
            <h2 id="sidebar-title" className="feedbacker-modal-title">
              Feedback Manager
            </h2>
            <p
              className="form-help"
              style={{ fontSize: '14px', color: 'var(--fb-text-secondary)', marginTop: '4px' }}
            >
              {feedbacks.length} feedback item{feedbacks.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="modal-header-actions" style={{ display: 'flex', gap: '8px' }}>
            {feedbacks.length > 0 && (
              <>
                {/* Export button */}
                <button
                  className="feedbacker-btn feedbacker-btn-secondary"
                  onClick={handleExportClick}
                  title="Export feedback"
                  aria-label="Export feedback"
                >
                  <ArrowDownTrayIcon />
                </button>

                {/* Clear all button */}
                <button
                  className="feedbacker-btn feedbacker-btn-danger"
                  onClick={handleClearAllConfirm}
                  title="Clear all feedback"
                  aria-label="Clear all feedback"
                >
                  <TrashIcon />
                </button>
              </>
            )}

            {/* Close button */}
            <button className="feedbacker-btn-icon" onClick={onClose} aria-label="Close sidebar">
              <XMarkIcon />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="feedbacker-modal-body">
          {feedbacks.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--feedbacker-text-secondary)',
                padding: 'var(--feedbacker-space-8) var(--feedbacker-space-4)'
              }}
            >
              <p>No feedback items yet.</p>
              <p
                style={{
                  fontSize: 'var(--feedbacker-font-size-sm)',
                  marginTop: 'var(--feedbacker-space-2)'
                }}
              >
                Click &quot;New feedback&quot; to get started!
              </p>
            </div>
          ) : (
            <FeedbackList
              feedbacks={feedbacks}
              onEdit={onEditFeedback}
              onDelete={handleDeleteConfirm}
            />
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          isDanger={confirmDialog.isDanger || false}
        />
      )}

      {/* Export Dialog */}
      {exportDialog && (
        <ExportDialog
          isOpen={exportDialog}
          feedbackCount={feedbacks.length}
          onExport={handleExportFormat}
          onCancel={() => setExportDialog(false)}
        />
      )}
    </div>
  );
};
