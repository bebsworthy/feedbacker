/**
 * useFeedbackEvent hook - Event-based communication between components
 * Provides pub/sub pattern for component interactions
 */

import { useCallback, useEffect, useRef } from 'react';
import { ComponentInfo, FeedbackEventEmitter } from '@feedbacker/core';
import type { EventType, EventListener } from '@feedbacker/core';

export interface UseFeedbackEventResult {
  emit: (type: EventType, payload?: any) => void;
  on: <T = any>(type: EventType, listener: EventListener<T>) => () => void;
  once: <T = any>(type: EventType, listener: EventListener<T>) => () => void;
}

// Global event emitter instance
const globalEventEmitter = new FeedbackEventEmitter();

export const useFeedbackEvent = (): UseFeedbackEventResult => {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  const emit = useCallback((type: EventType, payload?: any) => {
    globalEventEmitter.emit(type, payload);
  }, []);

  const on = useCallback(<T = any>(type: EventType, listener: EventListener<T>) => {
    const cleanup = globalEventEmitter.on(type, listener);
    cleanupFunctions.current.push(cleanup);
    return cleanup;
  }, []);

  const once = useCallback(<T = any>(type: EventType, listener: EventListener<T>) => {
    const cleanup = globalEventEmitter.once(type, listener);
    cleanupFunctions.current.push(cleanup);
    return cleanup;
  }, []);

  // Cleanup all listeners when component unmounts
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach((cleanup) => cleanup());
      cleanupFunctions.current = [];
    };
  }, []);

  return {
    emit,
    on,
    once
  };
};

// Export common event helper functions
export const useFeedbackEventHelpers = () => {
  const { emit, on, once } = useFeedbackEvent();

  const selectComponent = useCallback(
    (componentInfo: ComponentInfo) => {
      emit('component:selected', componentInfo);
    },
    [emit]
  );

  const openModal = useCallback(
    (componentInfo: ComponentInfo) => {
      emit('modal:open', componentInfo);
    },
    [emit]
  );

  const closeModal = useCallback(() => {
    emit('modal:close');
  }, [emit]);

  const minimizeModal = useCallback(() => {
    emit('modal:minimize');
  }, [emit]);

  const restoreModal = useCallback(() => {
    emit('modal:restore');
  }, [emit]);

  const openSidebar = useCallback(() => {
    emit('sidebar:open');
  }, [emit]);

  const closeSidebar = useCallback(() => {
    emit('sidebar:close');
  }, [emit]);

  const captureScreenshot = useCallback(
    (element?: HTMLElement) => {
      emit('screenshot:capture', element);
    },
    [emit]
  );

  const screenshotComplete = useCallback(
    (screenshot: string) => {
      emit('screenshot:complete', screenshot);
    },
    [emit]
  );

  const saveDraft = useCallback(
    (draft: { componentInfo: ComponentInfo; comment: string; screenshot?: string }) => {
      emit('draft:save', draft);
    },
    [emit]
  );

  const clearDraft = useCallback(() => {
    emit('draft:clear');
  }, [emit]);

  const submitFeedback = useCallback(
    (feedback: any) => {
      emit('feedback:submit', feedback);
    },
    [emit]
  );

  const exportFeedback = useCallback(
    (options: any) => {
      emit('feedback:export', options);
    },
    [emit]
  );

  return {
    // Event listeners
    on,
    once,

    // Event emitters
    selectComponent,
    openModal,
    closeModal,
    minimizeModal,
    restoreModal,
    openSidebar,
    closeSidebar,
    captureScreenshot,
    screenshotComplete,
    saveDraft,
    clearDraft,
    submitFeedback,
    exportFeedback
  };
};
