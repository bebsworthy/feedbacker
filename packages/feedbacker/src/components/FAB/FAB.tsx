/**
 * FAB (Floating Action Button) component
 * Main entry point for feedback interactions with expand/collapse functionality
 * Optimized with React.memo and performance improvements
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useFeedbackContext } from '../../context/FeedbackContext';
import { useFeedbackEvent } from '../../hooks/useFeedbackEvent';
import { FABAction } from './FABAction';
import {
  MegaphoneIcon,
  CloseIcon,
  MessageIcon,
  ListIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  DraftIndicator
} from '../../icons';
import { debounce } from '../../utils/performance';
import logger from '../../utils/logger';

interface FABProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

const FABComponent: React.FC<FABProps> = ({ position = 'bottom-right', className = '' }) => {
  const { draft, isActive, feedbacks } = useFeedbackContext();
  const { emit } = useFeedbackEvent();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Debounced outside click handler to prevent excessive event handling
  const debouncedOutsideClickHandler = useMemo(() => {
    return debounce((event: MouseEvent) => {
      if (isExpanded && fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }, 50);
  }, [isExpanded]);

  // Handle outside click to collapse FAB
  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('mousedown', debouncedOutsideClickHandler);
      return () => {
        document.removeEventListener('mousedown', debouncedOutsideClickHandler);
        debouncedOutsideClickHandler.cancel();
      };
    }
  }, [isExpanded, debouncedOutsideClickHandler]);

  // Handle Escape key to collapse FAB
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isExpanded]);

  const toggleExpanded = useCallback(() => {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);
    setIsExpanded((prev) => !prev);

    // Reset animation state after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const handleNewFeedback = useCallback(() => {
    logger.debug('New feedback action triggered');
    setIsExpanded(false);
    emit('selection:start', {});
  }, [emit]);

  const handleShowManager = useCallback(() => {
    logger.debug('Show manager action triggered');
    setIsExpanded(false);
    emit('manager:open', {});
  }, [emit]);

  const handleDraftRestore = useCallback(() => {
    logger.debug('Draft restore action triggered');
    setIsExpanded(false);
    emit('draft:restore', {});
  }, [emit]);

  const handleExport = useCallback(() => {
    logger.debug('Export action triggered');
    setIsExpanded(false);
    emit('export:open', {});
  }, [emit]);

  const handleClearAll = useCallback(() => {
    logger.debug('Clear all action triggered');
    setIsExpanded(false);
    emit('clearall:confirm', {});
  }, [emit]);

  // Memoized position styles calculation
  const positionStyles = useMemo(() => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end' as const,
      gap: '12px'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px', alignItems: 'flex-start' as const };
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: '20px',
          left: '20px',
          alignItems: 'flex-start' as const,
          flexDirection: 'column-reverse' as const
        };
      case 'bottom-right':
      default:
        return {
          ...baseStyles,
          bottom: '20px',
          right: '20px',
          flexDirection: 'column-reverse' as const
        };
    }
  }, [position]);

  // Memoized action list to prevent unnecessary re-renders
  const actionList = useMemo(() => {
    const actions = [
      {
        id: 'new-feedback',
        label: 'New feedback',
        icon: <MessageIcon size={20} />,
        onClick: handleNewFeedback,
        badgeCount: undefined
      },
      {
        id: 'show-manager',
        label: 'Show manager',
        icon: <ListIcon size={20} />,
        onClick: handleShowManager,
        badgeCount: feedbacks.length
      }
    ];

    // Only show export if there are feedbacks
    if (feedbacks.length > 0) {
      actions.push({
        id: 'export',
        label: 'Export feedback',
        icon: <ArrowDownTrayIcon size={20} />,
        onClick: handleExport,
        badgeCount: undefined
      });

      actions.push({
        id: 'clear-all',
        label: 'Clear all',
        icon: <TrashIcon size={20} />,
        onClick: handleClearAll,
        badgeCount: undefined
      });
    }

    return actions;
  }, [handleNewFeedback, handleShowManager, handleExport, handleClearAll, feedbacks.length]);

  // Zero impact when inactive - early return (Requirement 10.4)
  if (!isActive) {
    return null;
  }

  return (
    <div ref={fabRef} className={`feedbacker-fab ${className}`} style={positionStyles}>
      {/* Action buttons - render ABOVE FAB when position is BOTTOM */}
      {isExpanded && position.includes('bottom') && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '8px',
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'bottom',
            position: 'absolute',
            bottom: '64px',
            right: 0
          }}
        >
          {actionList.map((action) => (
            <FABAction
              key={action.id}
              id={action.id}
              label={action.label}
              icon={action.icon}
              onClick={action.onClick}
              badgeCount={action.badgeCount}
            />
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        className="feedbacker-fab-main"
        onClick={draft ? handleDraftRestore : toggleExpanded}
        aria-label={
          draft
            ? 'Restore draft feedback'
            : isExpanded
              ? 'Close feedback actions'
              : 'Open feedback actions'
        }
        style={{
          position: 'relative',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'var(--fb-primary, #3b82f6)',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--fb-shadow, 0 4px 12px rgba(0, 0, 0, 0.15))',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'rotate(0deg)',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = 'var(--fb-shadow, 0 6px 16px rgba(0, 0, 0, 0.2))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'var(--fb-shadow, 0 4px 12px rgba(0, 0, 0, 0.15))';
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = '3px solid rgba(59, 130, 246, 0.5)';
          e.currentTarget.style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
        }}
      >
        {/* Draft indicator */}
        {draft && <DraftIndicator />}

        {/* Feedback count badge */}
        {feedbacks.length > 0 && !isExpanded && (
          <div
            className="feedbacker-fab-badge"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
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
            {feedbacks.length > 99 ? '99+' : feedbacks.length}
          </div>
        )}

        {/* Main icon */}
        {isExpanded ? (
          <CloseIcon size={24} color="#ffffff" />
        ) : (
          <MegaphoneIcon size={24} color="#ffffff" />
        )}
      </button>

      {/* Action buttons - render BELOW FAB when position is TOP */}
      {isExpanded && position.includes('top') && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: 'top',
            position: 'absolute',
            top: '64px',
            right: 0
          }}
        >
          {actionList.map((action) => (
            <FABAction
              key={action.id}
              id={action.id}
              label={action.label}
              icon={action.icon}
              onClick={action.onClick}
              badgeCount={action.badgeCount}
            />
          ))}
        </div>
      )}
    </div>
  );
};

FABComponent.displayName = 'FAB';

export const FAB = React.memo(FABComponent);
