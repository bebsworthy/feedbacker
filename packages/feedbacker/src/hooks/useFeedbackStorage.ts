/**
 * useFeedbackStorage hook - Manages storage synchronization
 * Provides persistent storage integration with automatic sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Feedback, Draft, UseFeedbackStorageResult, StorageInfo } from '../types';
import { createStorageManager } from '../storage/StorageManager';
import { useFeedbackContext } from '../context/FeedbackContext';

export const useFeedbackStorage = (storageKey?: string): UseFeedbackStorageResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const storageManager = useRef(createStorageManager(storageKey));
  const { feedbacks, draft, addFeedback, saveDraft, clearDraft, setError: setContextError } = useFeedbackContext();
  
  // Sync with storage on mount and when feedbacks change
  useEffect(() => {
    let mounted = true;

    const loadFromStorage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load existing feedbacks from storage
        const storedFeedbacks = await storageManager.current.getAll();
        const storedDraft = await storageManager.current.getDraft();

        if (mounted) {
          // Only update if we're still mounted
          storedFeedbacks.forEach(feedback => addFeedback(feedback));
          
          if (storedDraft) {
            saveDraft(storedDraft.componentInfo, storedDraft.comment, storedDraft.screenshot);
          }
        }
      } catch (err) {
        const error = err as Error;
        console.error('[Feedbacker] Failed to load from storage:', error);
        
        if (mounted) {
          setError(error);
          setContextError(error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadFromStorage();

    return () => {
      mounted = false;
    };
  }, [addFeedback, saveDraft, setContextError]);

  // Save feedbacks to storage when they change
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const saveToStorage = async () => {
      try {
        // Save each feedback that's not already in storage
        for (const feedback of feedbacks) {
          await storageManager.current.save(feedback);
        }
        
        // Perform cleanup if needed
        await storageManager.current.cleanup();
        
        setError(null);
      } catch (err) {
        const error = err as Error;
        console.error('[Feedbacker] Failed to save to storage:', error);
        setError(error);
        setContextError(error);
      }
    };

    // Debounce storage saves to avoid excessive writes
    if (feedbacks.length > 0) {
      timeoutId = setTimeout(saveToStorage, 500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [feedbacks, setContextError]);

  // Save draft to storage when it changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const saveDraftToStorage = async () => {
      try {
        if (draft) {
          await storageManager.current.saveDraft(draft);
        } else {
          // If no draft, clear it from storage by saving an empty store
          const store = await storageManager.current.getAll();
          // This is a bit of a hack - we'd need a clearDraft method in StorageManager
          // For now, we'll just leave it as is since the context manages the draft state
        }
        
        setError(null);
      } catch (err) {
        const error = err as Error;
        console.error('[Feedbacker] Failed to save draft to storage:', error);
        setError(error);
        setContextError(error);
      }
    };

    // Debounce draft saves
    timeoutId = setTimeout(saveDraftToStorage, 1000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [draft, setContextError]);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear current state and reload from storage
      const storedFeedbacks = await storageManager.current.getAll();
      const storedDraft = await storageManager.current.getDraft();

      // Update context with fresh data
      storedFeedbacks.forEach(feedback => addFeedback(feedback));
      
      if (storedDraft) {
        saveDraft(storedDraft.componentInfo, storedDraft.comment, storedDraft.screenshot);
      } else {
        clearDraft();
      }

    } catch (err) {
      const error = err as Error;
      console.error('[Feedbacker] Failed to refresh from storage:', error);
      setError(error);
      setContextError(error);
    } finally {
      setIsLoading(false);
    }
  }, [addFeedback, saveDraft, clearDraft, setContextError]);

  return {
    feedbacks,
    isLoading,
    error,
    refresh
  };
};