/**
 * ConfirmDialog - Confirmation dialog component
 *
 * Features:
 * - Modal dialog with backdrop
 * - Confirm/Cancel actions
 * - Danger variant styling
 * - Keyboard support (Escape to cancel)
 */

import React, { useEffect, useRef } from 'react';
import { ExclamationTriangleIcon } from '../../icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDanger = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      // Focus the cancel button by default for safety
      cancelButtonRef.current.focus();
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
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
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
          maxWidth: '400px',
          padding: '24px',

          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Header with Icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {isDanger && (
            <div
              style={{
                color: '#ef4444',
                flexShrink: 0,
                marginTop: '2px'
              }}
            >
              <ExclamationTriangleIcon size={24} />
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h3
              id="confirm-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#1f2937'
              }}
            >
              {title}
            </h3>

            <p
              id="confirm-message"
              style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: 1.5
              }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px'
          }}
        >
          <button
            ref={cancelButtonRef}
            className="feedbacker-btn feedbacker-btn-secondary"
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>

          <button
            className={`feedbacker-btn ${
              isDanger ? 'feedbacker-btn-danger' : 'feedbacker-btn-primary'
            }`}
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
