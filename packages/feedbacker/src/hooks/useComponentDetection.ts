/**
 * useComponentDetection Hook
 * Manages component detection state and interactions with performance optimizations
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.6, 9.2, 9.3, 10.2, 10.3, 10.4
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { UseComponentDetectionResult, ComponentInfo } from '../types';
import { DetectionChain, DevToolsStrategy, FiberStrategy, HeuristicStrategy, FallbackStrategy } from '../detection';
import { requestIdleCallback, cancelIdleCallback, debounce, throttle, performanceMonitor } from '../utils/performance';

export function useComponentDetection(): UseComponentDetectionResult {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  
  const detectionChainRef = useRef<DetectionChain | null>(null);
  const lastTouchTarget = useRef<HTMLElement | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const idleCallbackId = useRef<number | null>(null);
  const lastDetectedElement = useRef<HTMLElement | null>(null);

  // Initialize detection chain on first use
  const initializeDetectionChain = useCallback(() => {
    if (!detectionChainRef.current) {
      const chain = new DetectionChain();
      const devToolsStrategy = new DevToolsStrategy();
      const fiberStrategy = new FiberStrategy();
      const heuristicStrategy = new HeuristicStrategy();
      const fallbackStrategy = new FallbackStrategy();
      
      chain.buildChain(devToolsStrategy, fiberStrategy, heuristicStrategy, fallbackStrategy);
      detectionChainRef.current = chain;
    }
    return detectionChainRef.current;
  }, []);

  // Handle component detection with performance monitoring
  const detectComponent = useCallback((element: HTMLElement): ComponentInfo | null => {
    const endMark = performanceMonitor.mark('component-detection');
    try {
      const chain = initializeDetectionChain();
      const result = chain.detectComponent(element);
      endMark();
      return result;
    } catch (error) {
      endMark();
      console.error('[Feedbacker] Component detection failed:', error);
      return null;
    }
  }, [initializeDetectionChain]);

  // State for hovering vs selected
  const [hoveredComponent, setHoveredComponent] = useState<ComponentInfo | null>(null);
  
  // Optimized detection function that avoids duplicate work - for hover only
  const detectComponentOptimized = useCallback((element: HTMLElement): void => {
    // Skip if same element as last detection
    if (lastDetectedElement.current === element) {
      return;
    }
    
    lastDetectedElement.current = element;
    
    // Cancel any pending idle callback
    if (idleCallbackId.current !== null) {
      cancelIdleCallback(idleCallbackId.current);
    }

    // Schedule detection during idle time for better performance (Requirement 10.2)
    idleCallbackId.current = requestIdleCallback((deadline) => {
      if (deadline.timeRemaining() > 5 || deadline.didTimeout) {
        const componentInfo = detectComponent(element);
        setHoveredComponent(componentInfo); // Set hovered, not selected!
      } else {
        // Re-schedule if not enough time
        idleCallbackId.current = requestIdleCallback((deadline) => {
          const componentInfo = detectComponent(element);
          setHoveredComponent(componentInfo); // Set hovered, not selected!
        }, { timeout: 100 });
      }
    }, { timeout: 50 });
  }, [detectComponent]);

  // Create a ref to track active state for event handlers
  const isActiveRef = useRef(isActive);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Throttled mouse move handler for better performance (Requirement 10.3)
  const handleMouseMove = useMemo(
    () => throttle((event: MouseEvent) => {
      if (!isActiveRef.current) {
        console.log('[useComponentDetection] Mouse move but not active');
        return;
      }

      const target = event.target as HTMLElement;
      if (target) {
        console.log('[useComponentDetection] Detecting component for:', target.tagName);
        detectComponentOptimized(target);
      }
    }, 16), // ~60fps
    [detectComponentOptimized]
  );

  // Mobile touch-and-drag interaction handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!isActive) return;

    const touch = event.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    
    if (target) {
      lastTouchTarget.current = target;
      dragStartRef.current = { x: touch.clientX, y: touch.clientY };
      
      // Prevent scrolling during component selection (Requirement 9.4)
      event.preventDefault();
      
      // Haptic feedback if supported (Requirement 9.3)
      if ('vibrate' in navigator) {
        navigator.vibrate(50); // Light haptic feedback
      }
    }
  }, [isActive]);

  // Debounced touch move handler to avoid excessive detection calls
  const handleTouchMove = useCallback(
    debounce((event: TouchEvent) => {
      if (!isActive || !dragStartRef.current) return;

      const touch = event.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      
      // Calculate drag distance to determine if this is a drag vs. tap
      const dragDistance = Math.sqrt(
        Math.pow(touch.clientX - dragStartRef.current.x, 2) + 
        Math.pow(touch.clientY - dragStartRef.current.y, 2)
      );
      
      // Only update selection if dragging more than 10px
      if (dragDistance > 10 && target && target !== lastTouchTarget.current) {
        lastTouchTarget.current = target;
        
        detectComponentOptimized(target);
        
        // Light haptic feedback for component changes
        if ('vibrate' in navigator) {
          navigator.vibrate(25);
        }
      }
      
      // Prevent scrolling during drag
      event.preventDefault();
    }, 50, { leading: true, trailing: true }),
    [isActive, detectComponentOptimized]
  );

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!isActive) return;
    
    // If no dragging occurred, select the component at touch point
    if (dragStartRef.current && lastTouchTarget.current) {
      const componentInfo = detectComponent(lastTouchTarget.current);
      setSelectedComponent(componentInfo);
      
      // Stronger haptic feedback for selection
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    }
    
    dragStartRef.current = null;
  }, [isActive, detectComponent]);

  // Mouse click handler for desktop selection
  const handleClick = useMemo(
    () => (event: MouseEvent) => {
      if (!isActiveRef.current) return;
      
      const target = event.target as HTMLElement;
      if (target) {
        event.preventDefault();
        event.stopPropagation();
        
        const componentInfo = detectComponent(target);
        setSelectedComponent(componentInfo); // This triggers the modal
        setHoveredComponent(null); // Clear hover
        console.log('[useComponentDetection] Component CLICKED and selected:', componentInfo);
      }
    }, 
    [detectComponent]
  );

  // Deactivate component detection - ensures zero impact when inactive (Requirement 10.4)
  const deactivate = useCallback(() => {
    if (!isActive) return;
    
    setIsActive(false);
    setSelectedComponent(null);
    setHoveredComponent(null);
    
    // Cancel any pending idle callbacks
    if (idleCallbackId.current !== null) {
      cancelIdleCallback(idleCallbackId.current);
      idleCallbackId.current = null;
    }
    
    // Cancel throttled/debounced functions
    if (handleMouseMove.cancel) {
      handleMouseMove.cancel();
    }
    if (handleTouchMove.cancel) {
      handleTouchMove.cancel();
    }
    
    // Reset cursor
    document.body.style.cursor = '';
    
    // Reset state
    lastTouchTarget.current = null;
    dragStartRef.current = null;
    lastDetectedElement.current = null;
  }, [isActive, handleMouseMove, handleTouchMove]);

  // ESC key handler to exit component selection mode (Requirement 3.6)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActiveRef.current) return;
    
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      console.log('[useComponentDetection] ESC key pressed, deactivating');
      deactivate();
    }
  }, [deactivate]);

  // Activate component detection
  const activate = useCallback(() => {
    console.log('[useComponentDetection] activate called, current isActive:', isActive);
    if (isActive) {
      console.log('[useComponentDetection] Already active, returning');
      return;
    }
    
    console.log('[useComponentDetection] Setting isActive to true');
    setIsActive(true);
    // Cursor styling
    document.body.style.cursor = 'crosshair';
  }, [isActive]);

  // Setup and cleanup event listeners when active state changes
  useEffect(() => {
    if (isActive) {
      console.log('[useComponentDetection] Adding event listeners');
      // Add event listeners for desktop interaction
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleKeyDown);
      
      // Add event listeners for mobile interaction (Requirement 9.2)
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      // Cleanup function
      return () => {
        console.log('[useComponentDetection] Removing event listeners');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isActive, handleMouseMove, handleClick, handleKeyDown, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        deactivate();
      }
    };
  }, [isActive, deactivate]);

  return {
    isActive,
    activate,
    deactivate,
    selectedComponent,
    hoveredComponent
  };
}