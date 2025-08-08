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
import styles from '../../styles/feedbacker.module.css';

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
          zIndex: 'calc(var(--feedbacker-z-sidebar) + 2)',
          
          background: 'var(--feedbacker-bg-primary)',
          border: '1px solid var(--feedbacker-border-primary)',
          borderRadius: 'var(--feedbacker-radius-lg)',
          boxShadow: 'var(--feedbacker-shadow-xl)',
          
          width: '90vw',
          maxWidth: '400px',
          padding: 'var(--feedbacker-space-6)',
          
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--feedbacker-space-4)'
        }}
      >
        {/* Header with Icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--feedbacker-space-3)' }}>
          {isDanger && (
            <div style={{
              color: 'var(--feedbacker-error)',
              flexShrink: 0,
              marginTop: '2px'
            }}>
              <ExclamationTriangleIcon size={24} />
            </div>
          )}
          
          <div style={{ flex: 1 }}>
            <h3 
              id="confirm-title"
              style={{
                margin: 0,
                fontSize: 'var(--feedbacker-font-size-lg)',
                fontWeight: 600,
                color: 'var(--feedbacker-text-primary)'
              }}
            >
              {title}
            </h3>
            
            <p 
              id="confirm-message"
              style={{
                margin: 'var(--feedbacker-space-2) 0 0 0',
                fontSize: 'var(--feedbacker-font-size-base)',
                color: 'var(--feedbacker-text-secondary)',
                lineHeight: 1.5
              }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: 'var(--feedbacker-space-2)' 
        }}>
          <button
            ref={cancelButtonRef}
            className={`${styles['feedbacker-button']} ${styles['feedbacker-button-secondary']}`}
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>
          
          <button
            className={`${styles['feedbacker-button']} ${
              isDanger 
                ? styles['feedbacker-button-danger'] 
                : styles['feedbacker-button-primary']
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