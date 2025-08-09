/**
 * FABAction component - Individual action button in expanded FAB
 * Optimized with React.memo for performance
 */

import React from 'react';

interface FABActionProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  badgeCount?: number;
}

export const FABAction: React.FC<FABActionProps> = React.memo(
  ({ id, label, icon, onClick, className = '', badgeCount }) => {
    return (
      <button
        className={`feedbacker-fab-action ${className}`}
        onClick={onClick}
        title={label}
        aria-label={label}
        data-action={id}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'var(--fb-background, #ffffff)',
          border: '1px solid var(--fb-border, #e5e7eb)',
          borderRadius: '8px',
          color: 'var(--fb-text, #1f2937)',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--fb-shadow, 0 2px 4px rgba(0, 0, 0, 0.1))',
          minWidth: '44px', // Minimum touch target
          minHeight: '44px',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--fb-primary, #3b82f6)';
          e.currentTarget.style.color = '#ffffff';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--fb-shadow, 0 4px 8px rgba(0, 0, 0, 0.15))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--fb-background, #ffffff)';
          e.currentTarget.style.color = 'var(--fb-text, #1f2937)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--fb-shadow, 0 2px 4px rgba(0, 0, 0, 0.1))';
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = '2px solid var(--fb-primary, #3b82f6)';
          e.currentTarget.style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
        }}
      >
        {/* Badge count */}
        {badgeCount !== undefined && badgeCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #ffffff',
              zIndex: 1
            }}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </div>
        )}
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span>{label}</span>
      </button>
    );
  }
);
