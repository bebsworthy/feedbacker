/**
 * ComponentOverlay Component
 * Renders visual overlay highlighting for selected components
 * Optimized with performance improvements and context integration
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.6, 9.2, 9.3
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ComponentInfo } from '../types';
import { useComponentDetection } from '../hooks/useComponentDetection';
import { debounce, throttle, performanceMonitor } from '../utils/performance';
import styles from '../styles/feedbacker.module.css';

interface OverlayPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const ComponentOverlay: React.FC = React.memo(() => {
  const { isActive, selectedComponent } = useComponentDetection();
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const animationFrameRef = useRef<number>();

  // Memoized debounced position update function
  const debouncedUpdatePosition = useMemo(() => {
    return debounce(() => {
      if (!selectedComponent || !isActive) {
        setOverlayPosition(null);
        setIsVisible(false);
        return;
      }

      const endMark = performanceMonitor.mark('overlay-position-update');
      
      const element = selectedComponent.element;
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
    }, 16, { leading: true, trailing: true }); // ~60fps
  }, [selectedComponent, isActive]);

  // Throttled scroll handler for better performance
  const throttledScrollHandler = useMemo(() => {
    return throttle(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(debouncedUpdatePosition);
    }, 16); // ~60fps
  }, [debouncedUpdatePosition]);

  // Update overlay position based on selected component
  useEffect(() => {
    if (selectedComponent && isActive) {
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
  }, [selectedComponent, isActive, debouncedUpdatePosition, throttledScrollHandler]);

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
    if (!selectedComponent) return null;
    
    return {
      name: selectedComponent.name || 'Unknown Component',
      path: selectedComponent.path?.join(' → ') || ''
    };
  }, [selectedComponent]);

  // Don't render anything if not active or no component selected - zero impact when inactive
  if (!isActive || !selectedComponent || !overlayPosition || !isVisible || !componentInfo) {
    return null;
  }

  return (
    <>
      {/* Main overlay highlighting the component */}
      <div
        className={`${styles.componentOverlay} ${styles.componentOverlayVisible}`}
        style={{
          position: 'absolute',
          top: `${overlayPosition.top}px`,
          left: `${overlayPosition.left}px`,
          width: `${overlayPosition.width}px`,
          height: `${overlayPosition.height}px`,
          pointerEvents: 'none',
          zIndex: 999999
        }}
      >
        {/* Border highlight */}
        <div className={styles.componentBorder} />
        
        {/* Background overlay with opacity */}
        <div className={styles.componentBackground} />
        
        {/* Component info tooltip */}
        <div 
          className={styles.componentTooltip}
          style={{
            position: 'absolute',
            top: overlayPosition.height > 40 ? '8px' : '-40px',
            left: '8px',
            maxWidth: `${Math.max(200, overlayPosition.width - 16)}px`
          }}
        >
          <div className={styles.componentTooltipContent}>
            <div className={styles.componentName}>{componentInfo.name}</div>
            {componentInfo.path && (
              <div className={styles.componentPath} title={componentInfo.path}>
                {componentInfo.path}
              </div>
            )}
          </div>
          <div className={styles.componentTooltipArrow} />
        </div>
      </div>
      
      {/* Detection cursor overlay for mobile */}
      <div className={styles.detectionCursor} />
    </>
  );
});