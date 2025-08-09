/**
 * MinimizedState Component
 * Minimized floating indicator for feedback modal
 *
 * Requirements: 4.3, 4.4
 */

import React from 'react';
import { ComponentInfo } from '../../types';

interface MinimizedStateProps {
  componentInfo: ComponentInfo | null;
  hasScreenshot: boolean;
  isDirty: boolean;
  onRestore: () => void;
  onDiscard: () => void;
}

export const MinimizedState: React.FC<MinimizedStateProps> = ({
  componentInfo,
  hasScreenshot,
  isDirty,
  onRestore,
  onDiscard
}) => {
  const componentName = componentInfo?.name || 'Unknown Component';

  return (
    <div
      className="feedbacker-modal-minimized"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999
      }}
    >
      {/* Main minimized indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }}
        onClick={onRestore}
        role="button"
        tabIndex={0}
        aria-label={`Restore feedback modal for ${componentName}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onRestore();
          }
        }}
      >
        {/* Draft status indicator */}
        {isDirty && (
          <div style={{ position: 'absolute', top: '-4px', right: '-4px' }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <circle cx="4" cy="4" r="4" fill="orange" />
            </svg>
          </div>
        )}

        {/* Component icon */}
        <div style={{ color: '#3b82f6', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 3a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M5 6h6M5 8h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Screenshot indicator */}
        {hasScreenshot && (
          <div style={{ color: '#6b7280', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 9V3a1 1 0 011-1h8a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle cx="4" cy="5" r="1" fill="currentColor" />
              <path
                d="M7 7l-1-1-1.5 1.5L3 6"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Component name */}
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1f2937' }}>{componentName}</span>

        {/* Restore icon */}
        <svg
          style={{ color: '#6b7280', marginLeft: '8px' }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M4 8l4-4M8 4H4v4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Discard button */}
      <button
        type="button"
        style={{
          padding: '8px',
          background: 'transparent',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
        onClick={onDiscard}
        title="Discard draft"
        aria-label="Discard feedback draft"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M9 3L3 9M3 3l6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};
