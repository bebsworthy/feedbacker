/**
 * FAB (Floating Action Button) component
 * Main entry point for feedback interactions with expand/collapse functionality
 * Optimized with React.memo and performance improvements
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useFeedbackContext } from '../../context/FeedbackContext';
import { useFeedbackEvent } from '../../hooks/useFeedbackEvent';
import { FABAction } from './FABAction';
import { PlusIcon, CloseIcon, MessageIcon, ListIcon, DraftIndicator } from '../../icons';
import { debounce } from '../../utils/performance';

interface FABProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export const FAB: React.FC<FABProps> = React.memo(({ 
  position = 'bottom-right',
  className = '' 
}) => {
  const { draft, isActive } = useFeedbackContext();
  const { emit } = useFeedbackEvent();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Debounced outside click handler to prevent excessive event handling
  const debouncedOutsideClickHandler = useMemo(() => {
    return debounce((event: MouseEvent) => {
      if (
        isExpanded && 
        fabRef.current && 
        !fabRef.current.contains(event.target as Node)
      ) {
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
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsExpanded(prev => !prev);
    
    // Reset animation state after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  const handleNewFeedback = useCallback(() => {
    console.log('[Feedbacker] New feedback action triggered');
    setIsExpanded(false);
    emit('selection:start', {});
  }, [emit]);

  const handleShowManager = useCallback(() => {
    console.log('[Feedbacker] Show manager action triggered');
    setIsExpanded(false);
    emit('manager:open', {});
  }, [emit]);

  const handleDraftRestore = useCallback(() => {
    console.log('[Feedbacker] Draft restore action triggered');
    setIsExpanded(false);
    emit('draft:restore', {});
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
        return { ...baseStyles, bottom: '20px', left: '20px', alignItems: 'flex-start' as const, flexDirection: 'column-reverse' as const };
      case 'bottom-right':
      default:
        return { ...baseStyles, bottom: '20px', right: '20px', flexDirection: 'column-reverse' as const };
    }
  }, [position]);

  // Memoized action list to prevent unnecessary re-renders
  const actionList = useMemo(() => [
    {
      id: "new-feedback",
      label: "New feedback",
      icon: <MessageIcon size={20} />,
      onClick: handleNewFeedback
    },
    {
      id: "show-manager",
      label: "Show manager",
      icon: <ListIcon size={20} />,
      onClick: handleShowManager
    }
  ], [handleNewFeedback, handleShowManager]);

  // Zero impact when inactive - early return (Requirement 10.4)
  if (!isActive) {
    return null;
  }

  return (
    <div
      ref={fabRef}
      className={`feedbacker-fab ${className}`}
      style={positionStyles}
    >
      {/* Action buttons - only show when expanded */}
      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transformOrigin: position.includes('bottom') ? 'bottom' : 'top'
          }}
        >
          {actionList.map(action => (
            <FABAction
              key={action.id}
              id={action.id}
              label={action.label}
              icon={action.icon}
              onClick={action.onClick}
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
            ? "Restore draft feedback" 
            : isExpanded 
              ? "Close feedback actions" 
              : "Open feedback actions"
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
          transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = `scale(1.1) ${isExpanded ? 'rotate(45deg)' : 'rotate(0deg)'}`;
          e.currentTarget.style.boxShadow = 'var(--fb-shadow, 0 6px 16px rgba(0, 0, 0, 0.2))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = `scale(1) ${isExpanded ? 'rotate(45deg)' : 'rotate(0deg)'}`;
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
        
        {/* Main icon */}
        {isExpanded ? (
          <CloseIcon size={24} color="#ffffff" />
        ) : (
          <PlusIcon size={24} color="#ffffff" />
        )}
      </button>
    </div>
  );
});