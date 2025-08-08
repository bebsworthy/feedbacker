/**
 * MinimizedState Component
 * Minimized floating indicator for feedback modal
 * 
 * Requirements: 4.3, 4.4
 */

import React from 'react';
import { ComponentInfo } from '../../types';
import styles from '../../styles/feedbacker.module.css';

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
    <div className={styles['minimized-feedback']}>
      {/* Main minimized indicator */}
      <div 
        className={styles['minimized-indicator']}
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
          <div className={styles['minimized-draft-indicator']}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <circle cx="4" cy="4" r="4" fill="orange" />
            </svg>
          </div>
        )}

        {/* Component icon */}
        <div className={styles['minimized-icon']}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path 
              d="M2 3a1 1 0 011-1h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" 
              fill="none"
              stroke="currentColor" 
              strokeWidth="1.5"
            />
            <path 
              d="M5 6h6M5 8h4" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Screenshot indicator */}
        {hasScreenshot && (
          <div className={styles['minimized-screenshot-indicator']}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path 
                d="M1 9V3a1 1 0 011-1h8a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1z" 
                fill="none"
                stroke="currentColor" 
                strokeWidth="1"
              />
              <circle cx="4" cy="5" r="1" fill="currentColor" />
              <path d="M7 7l-1-1-1.5 1.5L3 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Component name */}
        <span className={styles['minimized-text']}>
          {componentName}
        </span>

        {/* Restore icon */}
        <svg 
          className={styles['minimized-restore-icon']} 
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
        className={styles['minimized-discard']}
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