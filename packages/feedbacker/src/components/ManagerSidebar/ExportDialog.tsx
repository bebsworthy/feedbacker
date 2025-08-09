/**
 * ExportDialog - Dialog for selecting export format
 *
 * Features:
 * - Text-only markdown export
 * - Full ZIP export with images
 * - Format descriptions
 * - Cancel option
 */

import React, { useEffect, useRef } from 'react';
import { DocumentTextIcon, ArchiveBoxIcon } from '../../icons';

interface ExportDialogProps {
  isOpen: boolean;
  feedbackCount: number;
  onExport: (format: 'markdown' | 'zip') => void;
  onCancel: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  feedbackCount,
  onExport,
  onCancel
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const markdownButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && markdownButtonRef.current) {
      markdownButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll when dialog is open
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

  const handleMarkdownExport = () => {
    onExport('markdown');
  };

  const handleZipExport = () => {
    onExport('zip');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="feedbacker-root">
      {/* Backdrop */}
      <div
        className="feedbacker-modal-backdrop visible"
        style={{ zIndex: 99999 }}
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100000,

          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

          width: '90vw',
          maxWidth: '500px',
          padding: '24px',

          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header */}
        <div>
          <h3
            id="export-title"
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: '#1f2937'
            }}
          >
            Export Feedback
          </h3>

          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: '14px',
              color: '#6b7280'
            }}
          >
            Export {feedbackCount} feedback item{feedbackCount !== 1 ? 's' : ''} in your preferred
            format.
          </p>
        </div>

        {/* Export Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Markdown Export */}
          <button
            ref={markdownButtonRef}
            className="export-option"
            onClick={handleMarkdownExport}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',

              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',

              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                color: '#3b82f6',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              <DocumentTextIcon size={24} />
            </div>

            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1f2937'
                }}
              >
                Text Only (.md)
              </h4>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: 1.4
                }}
              >
                Markdown file with feedback comments and metadata. Images are excluded to keep file
                size small.
              </p>
            </div>
          </button>

          {/* ZIP Export */}
          <button
            className="export-option"
            onClick={handleZipExport}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',

              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',

              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                color: '#3b82f6',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              <ArchiveBoxIcon size={24} />
            </div>

            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1f2937'
                }}
              >
                Full Export (.zip)
              </h4>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: 1.4
                }}
              >
                ZIP archive with feedback.md, feedback.json, and all screenshots in an images/
                folder.
              </p>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            className="feedbacker-btn feedbacker-btn-secondary"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
