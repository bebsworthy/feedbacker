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
import styles from '../../styles/feedbacker.module.css';

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
    if (!isOpen) return;

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

  if (!isOpen) return null;

  return (
    <div className={styles['feedbacker-root']}>
      {/* Backdrop */}
      <div 
        className={`${styles['feedbacker-modal-backdrop']} ${styles['visible']}`}
        style={{ zIndex: 'calc(var(--feedbacker-z-sidebar) + 1)' }}
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
          zIndex: 'calc(var(--feedbacker-z-sidebar) + 2)',
          
          background: 'var(--feedbacker-bg-primary)',
          border: '1px solid var(--feedbacker-border-primary)',
          borderRadius: 'var(--feedbacker-radius-lg)',
          boxShadow: 'var(--feedbacker-shadow-xl)',
          
          width: '90vw',
          maxWidth: '500px',
          padding: 'var(--feedbacker-space-6)',
          
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--feedbacker-space-4)'
        }}
      >
        {/* Header */}
        <div>
          <h3 
            id="export-title"
            style={{
              margin: 0,
              fontSize: 'var(--feedbacker-font-size-lg)',
              fontWeight: 600,
              color: 'var(--feedbacker-text-primary)'
            }}
          >
            Export Feedback
          </h3>
          
          <p style={{
            margin: 'var(--feedbacker-space-2) 0 0 0',
            fontSize: 'var(--feedbacker-font-size-base)',
            color: 'var(--feedbacker-text-secondary)'
          }}>
            Export {feedbackCount} feedback item{feedbackCount !== 1 ? 's' : ''} in your preferred format.
          </p>
        </div>

        {/* Export Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--feedbacker-space-3)' }}>
          {/* Markdown Export */}
          <button
            ref={markdownButtonRef}
            className="export-option"
            onClick={handleMarkdownExport}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--feedbacker-space-3)',
              padding: 'var(--feedbacker-space-4)',
              
              background: 'var(--feedbacker-bg-secondary)',
              border: '1px solid var(--feedbacker-border-primary)',
              borderRadius: 'var(--feedbacker-radius-md)',
              
              cursor: 'pointer',
              transition: 'all var(--feedbacker-transition-fast)',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--feedbacker-bg-tertiary)';
              e.currentTarget.style.borderColor = 'var(--feedbacker-border-focus)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--feedbacker-bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--feedbacker-border-primary)';
            }}
          >
            <div style={{ 
              width: '24px', 
              height: '24px', 
              color: 'var(--feedbacker-primary)',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              <DocumentTextIcon size={24} />
            </div>
            
            <div>
              <h4 style={{
                margin: 0,
                fontSize: 'var(--feedbacker-font-size-base)',
                fontWeight: 600,
                color: 'var(--feedbacker-text-primary)'
              }}>
                Text Only (.md)
              </h4>
              <p style={{
                margin: 'var(--feedbacker-space-1) 0 0 0',
                fontSize: 'var(--feedbacker-font-size-sm)',
                color: 'var(--feedbacker-text-secondary)',
                lineHeight: 1.4
              }}>
                Markdown file with feedback comments and metadata. Images are excluded to keep file size small.
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
              gap: 'var(--feedbacker-space-3)',
              padding: 'var(--feedbacker-space-4)',
              
              background: 'var(--feedbacker-bg-secondary)',
              border: '1px solid var(--feedbacker-border-primary)',
              borderRadius: 'var(--feedbacker-radius-md)',
              
              cursor: 'pointer',
              transition: 'all var(--feedbacker-transition-fast)',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--feedbacker-bg-tertiary)';
              e.currentTarget.style.borderColor = 'var(--feedbacker-border-focus)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--feedbacker-bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--feedbacker-border-primary)';
            }}
          >
            <div style={{ 
              width: '24px', 
              height: '24px', 
              color: 'var(--feedbacker-primary)',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              <ArchiveBoxIcon size={24} />
            </div>
            
            <div>
              <h4 style={{
                margin: 0,
                fontSize: 'var(--feedbacker-font-size-base)',
                fontWeight: 600,
                color: 'var(--feedbacker-text-primary)'
              }}>
                Full Export (.zip)
              </h4>
              <p style={{
                margin: 'var(--feedbacker-space-1) 0 0 0',
                fontSize: 'var(--feedbacker-font-size-sm)',
                color: 'var(--feedbacker-text-secondary)',
                lineHeight: 1.4
              }}>
                ZIP archive with feedback.md, feedback.json, and all screenshots in an images/ folder.
              </p>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end' 
        }}>
          <button
            className={`${styles['feedbacker-button']} ${styles['feedbacker-button-secondary']}`}
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