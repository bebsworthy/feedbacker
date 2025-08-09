/**
 * ComponentOverlay Component
 * Renders visual overlay highlighting for selected components
 * Optimized with performance improvements and context integration
 *
 * Requirements: 3.1, 3.2, 3.3, 3.6, 9.2, 9.3
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useComponentDetection } from '../context/ComponentDetectionContext';
import { debounce, throttle, performanceMonitor } from '../utils/performance';
import logger from '../utils/logger';

interface OverlayPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const ComponentOverlay: React.FC = React.memo(() => {
  const { isActive, hoveredComponent } = useComponentDetection();
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition | null>(null);
  const [, setIsVisible] = useState<boolean>(false);
  const animationFrameRef = useRef<number>();

  logger.log(
    'Render - isActive:',
    isActive,
    'hoveredComponent:',
    hoveredComponent,
    'overlayPosition:',
    overlayPosition
  );

  // Memoized debounced position update function
  const debouncedUpdatePosition = useMemo(() => {
    return debounce(
      () => {
        if (!hoveredComponent || !isActive) {
          setOverlayPosition(null);
          setIsVisible(false);
          return;
        }

        const endMark = performanceMonitor.mark('overlay-position-update');

        const element = hoveredComponent.element;
        if (!element || !document.body.contains(element)) {
          setOverlayPosition(null);
          setIsVisible(false);
          endMark();
          return;
        }

        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        const position: OverlayPosition = {
          top: rect.top + scrollTop,
          left: rect.left + scrollLeft,
          width: rect.width,
          height: rect.height
        };

        setOverlayPosition(position);
        setIsVisible(true);
        endMark();
      },
      16,
      { leading: true, trailing: true }
    ); // ~60fps
  }, [hoveredComponent, isActive]);

  // Throttled scroll handler for better performance
  const throttledScrollHandler = useMemo(() => {
    return throttle(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(debouncedUpdatePosition);
    }, 16); // ~60fps
  }, [debouncedUpdatePosition]);

  // Update overlay position based on hovered component
  useEffect(() => {
    if (hoveredComponent && isActive) {
      // Initial position update
      debouncedUpdatePosition();

      // Update position on scroll and resize with throttling
      window.addEventListener('scroll', throttledScrollHandler, { passive: true });
      window.addEventListener('resize', throttledScrollHandler, { passive: true });

      return () => {
        window.removeEventListener('scroll', throttledScrollHandler);
        window.removeEventListener('resize', throttledScrollHandler);
        throttledScrollHandler.cancel();
        debouncedUpdatePosition.cancel();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      setIsVisible(false);
      setOverlayPosition(null);
      debouncedUpdatePosition.cancel();
      throttledScrollHandler.cancel();
    }
  }, [hoveredComponent, isActive, debouncedUpdatePosition, throttledScrollHandler]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Memoized component info to avoid recalculation
  const componentInfo = useMemo(() => {
    if (!hoveredComponent) {
      return null;
    }

    return {
      name: hoveredComponent.name || 'Unknown Component',
      path: hoveredComponent.path?.join(' → ') || ''
    };
  }, [hoveredComponent]);

  // Don't render anything if not active - zero impact when inactive
  if (!isActive) {
    return null;
  }

  // If no component hovered yet, still return null
  if (!hoveredComponent || !overlayPosition) {
    return null;
  }

  // Calculate tooltip position
  const tooltipHeight = 40; // Approximate tooltip height
  const tooltipMargin = 8; // Space between tooltip and component
  const minSpaceRequired = tooltipHeight + tooltipMargin;

  // Get viewport dimensions
  const viewportHeight = window.innerHeight;
  const componentTop = overlayPosition.top - window.pageYOffset;
  const componentBottom = componentTop + overlayPosition.height;

  // Calculate visible bounds of the component
  const visibleTop = Math.max(0, componentTop);
  const visibleBottom = Math.min(viewportHeight, componentBottom);
  const visibleHeight = visibleBottom - visibleTop;
  const visibleCenter = visibleTop + visibleHeight / 2;

  // Determine available space
  const spaceAbove = componentTop;
  const spaceBelow = viewportHeight - componentBottom;

  let tooltipTop: number;

  // If not enough space above AND below, center the tooltip in the VISIBLE area
  if (spaceAbove < minSpaceRequired && spaceBelow < minSpaceRequired) {
    tooltipTop = visibleCenter - tooltipHeight / 2;
  }
  // Place above if there's enough space, or if there's more space above than below
  else if (
    spaceAbove >= minSpaceRequired ||
    (spaceAbove > spaceBelow && spaceAbove > tooltipHeight)
  ) {
    tooltipTop = componentTop - tooltipHeight - tooltipMargin;
  }
  // Otherwise place below
  else {
    tooltipTop = componentBottom + tooltipMargin;
  }

  return (
    <>
      {/* Main overlay highlighting the component */}
      <div
        data-feedback-overlay="highlight"
        style={{
          position: 'fixed',
          top: `${overlayPosition.top - window.pageYOffset}px`,
          left: `${overlayPosition.left - window.pageXOffset}px`,
          width: `${overlayPosition.width}px`,
          height: `${overlayPosition.height}px`,
          pointerEvents: 'none',
          zIndex: 9998,
          border: '2px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderRadius: '4px',
          boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
          transition: 'all 0.1s ease'
        }}
      />

      {/* Component info tooltip */}
      <div
        data-feedback-overlay="label"
        style={{
          position: 'fixed',
          top: `${tooltipTop}px`,
          left: `${overlayPosition.left - window.pageXOffset}px`,
          maxWidth: `${Math.min(300, overlayPosition.width)}px`,
          minWidth: '120px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: '#ffffff',
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: componentInfo?.path ? '2px' : '0' }}>
          {componentInfo?.name}
        </div>
        {componentInfo?.path && (
          <div
            style={{
              opacity: 0.8,
              fontSize: '11px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={componentInfo.path}
          >
            {componentInfo.path}
          </div>
        )}
      </div>
    </>
  );
});
