/**
 * Feedback Context - Central state management for the feedback system
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Feedback, Draft, ComponentInfo } from '../types';

interface FeedbackContextValue {
  // State
  feedbacks: Feedback[];
  draft: Draft | null;
  isActive: boolean;
  error: Error | null;
  
  // Actions
  addFeedback: (feedback: Feedback) => void;
  updateFeedback: (id: string, updates: Partial<Feedback>) => void;
  deleteFeedback: (id: string) => void;
  clearAllFeedbacks: () => void;
  
  // Draft actions
  saveDraft: (componentInfo: ComponentInfo, comment: string, screenshot?: string) => void;
  clearDraft: () => void;
  restoreDraft: () => void;
  
  // UI actions
  setActive: (active: boolean) => void;
  setError: (error: Error | null) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

interface FeedbackContextProviderProps {
  children: React.ReactNode;
  onFeedbackSubmit?: (feedback: Feedback) => void;
}

export const FeedbackContextProvider: React.FC<FeedbackContextProviderProps> = ({
  children,
  onFeedbackSubmit
}) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const addFeedback = useCallback((feedback: Feedback) => {
    setFeedbacks(prev => [feedback, ...prev]);
    onFeedbackSubmit?.(feedback);
  }, [onFeedbackSubmit]);

  const updateFeedback = useCallback((id: string, updates: Partial<Feedback>) => {
    setFeedbacks(prev => 
      prev.map(feedback => 
        feedback.id === id ? { ...feedback, ...updates } : feedback
      )
    );
  }, []);

  const deleteFeedback = useCallback((id: string) => {
    setFeedbacks(prev => prev.filter(feedback => feedback.id !== id));
  }, []);

  const clearAllFeedbacks = useCallback(() => {
    setFeedbacks([]);
  }, []);

  const saveDraft = useCallback((componentInfo: ComponentInfo, comment: string, screenshot?: string) => {
    const now = new Date().toISOString();
    setDraft({
      componentInfo,
      comment,
      screenshot,
      createdAt: draft?.createdAt || now,
      updatedAt: now
    });
  }, [draft]);

  const clearDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const restoreDraft = useCallback(() => {
    // This will be handled by the modal component
    // The draft remains available for restoration
  }, []);

  const setActive = useCallback((active: boolean) => {
    setIsActive(active);
  }, []);

  const contextValue = useMemo<FeedbackContextValue>(() => ({
    // State
    feedbacks,
    draft,
    isActive,
    error,
    
    // Actions
    addFeedback,
    updateFeedback,
    deleteFeedback,
    clearAllFeedbacks,
    
    // Draft actions
    saveDraft,
    clearDraft,
    restoreDraft,
    
    // UI actions
    setActive,
    setError
  }), [
    feedbacks,
    draft,
    isActive,
    error,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    clearAllFeedbacks,
    saveDraft,
    clearDraft,
    restoreDraft,
    setActive
  ]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
    </FeedbackContext.Provider>
  );
};

/**
 * Hook to access the feedback context
 */
export const useFeedbackContext = (): FeedbackContextValue => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedbackContext must be used within a FeedbackProvider');
  }
  return context;
};