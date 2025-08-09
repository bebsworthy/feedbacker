/**
 * useFeedbackEvent hook - Event-based communication between components
 * Provides pub/sub pattern for component interactions
 */

import { useCallback, useEffect, useRef } from 'react';
import { ComponentInfo } from '../types';
import logger from '../utils/logger';

type EventType =
  | 'component:selected'
  | 'modal:open'
  | 'modal:close'
  | 'modal:minimize'
  | 'modal:restore'
  | 'sidebar:open'
  | 'sidebar:close'
  | 'screenshot:capture'
  | 'screenshot:complete'
  | 'draft:save'
  | 'draft:clear'
  | 'draft:restore'
  | 'feedback:submit'
  | 'feedback:export'
  | 'selection:start'
  | 'selection:cancel'
  | 'manager:open'
  | 'export:open'
  | 'clearall:confirm';

type EventListener<T = any> = (payload: T) => void;

export interface UseFeedbackEventResult {
  emit: (type: EventType, payload?: any) => void;
  on: <T = any>(type: EventType, listener: EventListener<T>) => () => void;
  once: <T = any>(type: EventType, listener: EventListener<T>) => () => void;
}

class FeedbackEventEmitter {
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private onceListeners: Map<EventType, Set<EventListener>> = new Map();

  emit(type: EventType, payload?: any): void {
    // Regular listeners
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          logger.error(`Event listener error for ${type}:`, error);
        }
      });
    }

    // Once listeners
    const onceTypeListeners = this.onceListeners.get(type);
    if (onceTypeListeners) {
      onceTypeListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          logger.error(`Once event listener error for ${type}:`, error);
        }
      });

      // Clear once listeners after execution
      this.onceListeners.delete(type);
    }
  }

  on<T = any>(type: EventType, listener: EventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const typeListeners = this.listeners.get(type)!;
    typeListeners.add(listener);

    // Return cleanup function
    return () => {
      typeListeners.delete(listener);
      if (typeListeners.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  once<T = any>(type: EventType, listener: EventListener<T>): () => void {
    if (!this.onceListeners.has(type)) {
      this.onceListeners.set(type, new Set());
    }

    const onceTypeListeners = this.onceListeners.get(type)!;
    onceTypeListeners.add(listener);

    // Return cleanup function
    return () => {
      onceTypeListeners.delete(listener);
      if (onceTypeListeners.size === 0) {
        this.onceListeners.delete(type);
      }
    };
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
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
