/**
 * Feedback Context - Central state management for the feedback system
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Feedback, Draft, ComponentInfo } from '../types';
import { MarkdownExporter } from '../export/MarkdownExporter';
import { ZipExporter } from '../export/ZipExporter';

interface FeedbackContextValue {
  // State
  feedbacks: Feedback[];
  draft: Draft | null;
  isActive: boolean;
  error: Error | null;
  autoCopy: boolean;
  autoDownload: boolean | 'markdown' | 'zip';
  
  // Actions
  addFeedback: (feedback: Feedback) => void;
  loadFeedbackFromStorage: (feedback: Feedback) => void;
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
  
  // Settings actions
  setAutoCopy: (enabled: boolean) => void;
  setAutoDownload: (setting: boolean | 'markdown' | 'zip') => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

interface FeedbackContextProviderProps {
  children: React.ReactNode;
  onFeedbackSubmit?: (feedback: Feedback) => void;
  autoCopy?: boolean;
  autoDownload?: boolean | 'markdown' | 'zip';
}

export const FeedbackContextProvider: React.FC<FeedbackContextProviderProps> = ({
  children,
  onFeedbackSubmit,
  autoCopy: propAutoCopy,
  autoDownload: propAutoDownload
}) => {
  // Initialize settings from localStorage or props
  const getInitialSettings = () => {
    try {
      const savedSettings = localStorage.getItem('feedbacker-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        return {
          autoCopy: propAutoCopy !== undefined ? propAutoCopy : (settings.autoCopy || false),
          autoDownload: propAutoDownload !== undefined ? propAutoDownload : (settings.autoDownload || false)
        };
      }
    } catch (error) {
      console.error('[Feedbacker] Failed to load initial settings:', error);
    }
    return {
      autoCopy: propAutoCopy || false,
      autoDownload: propAutoDownload || false
    };
  };

  const initialSettings = getInitialSettings();
  
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [autoCopy, setAutoCopy] = useState(initialSettings.autoCopy);
  const [autoDownload, setAutoDownload] = useState(initialSettings.autoDownload);

  // Auto-action helper functions
  const performAutoCopy = useCallback(async (feedback: Feedback) => {
    try {
      const markdown = MarkdownExporter.exportAsMarkdown([feedback]);
      await navigator.clipboard.writeText(markdown);
      console.log('[Feedbacker] Feedback copied to clipboard');
    } catch (error) {
      console.error('[Feedbacker] Failed to copy to clipboard:', error);
    }
  }, []);

  const performAutoDownload = useCallback(async (feedback: Feedback, format: 'markdown' | 'zip') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'markdown') {
        const markdown = MarkdownExporter.exportAsMarkdown([feedback]);
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback-${timestamp}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const zipBlob = await ZipExporter.exportAsZip([feedback]);
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback-${timestamp}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      console.log('[Feedbacker] Feedback auto-downloaded');
    } catch (error) {
      console.error('[Feedbacker] Failed to auto-download:', error);
    }
  }, []);

  const addFeedback = useCallback((feedback: Feedback) => {
    setFeedbacks(prev => {
      // Check if feedback with this ID already exists
      if (prev.some(f => f.id === feedback.id)) {
        return prev; // Don't add duplicate
      }
      return [feedback, ...prev];
    });
    
    // Trigger callback
    onFeedbackSubmit?.(feedback);
    
    // Perform auto-actions
    if (autoCopy) {
      performAutoCopy(feedback);
    }
    
    if (autoDownload) {
      const format = autoDownload === true ? 'markdown' : autoDownload;
      performAutoDownload(feedback, format);
    }
  }, [onFeedbackSubmit, autoCopy, autoDownload, performAutoCopy, performAutoDownload]);

  // Separate method for loading feedback from storage - doesn't trigger onFeedbackSubmit
  const loadFeedbackFromStorage = useCallback((feedback: Feedback) => {
    setFeedbacks(prev => {
      // Check if feedback with this ID already exists
      if (prev.some(f => f.id === feedback.id)) {
        return prev; // Don't add duplicate
      }
      return [feedback, ...prev];
    });
    // Do NOT trigger onFeedbackSubmit - this is existing feedback from storage
  }, []);

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

  const setAutoCopyState = useCallback((enabled: boolean) => {
    setAutoCopy(enabled);
    // Save to localStorage
    try {
      const settings = JSON.parse(localStorage.getItem('feedbacker-settings') || '{}');
      settings.autoCopy = enabled;
      localStorage.setItem('feedbacker-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('[Feedbacker] Failed to save settings:', error);
    }
  }, []);

  const setAutoDownloadState = useCallback((setting: boolean | 'markdown' | 'zip') => {
    setAutoDownload(setting);
    // Save to localStorage
    try {
      const settings = JSON.parse(localStorage.getItem('feedbacker-settings') || '{}');
      settings.autoDownload = setting;
      localStorage.setItem('feedbacker-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('[Feedbacker] Failed to save settings:', error);
    }
  }, []);

  const contextValue = useMemo<FeedbackContextValue>(() => ({
    // State
    feedbacks,
    draft,
    isActive,
    error,
    autoCopy,
    autoDownload,
    
    // Actions
    addFeedback,
    loadFeedbackFromStorage,
    updateFeedback,
    deleteFeedback,
    clearAllFeedbacks,
    
    // Draft actions
    saveDraft,
    clearDraft,
    restoreDraft,
    
    // UI actions
    setActive,
    setError,
    
    // Settings actions
    setAutoCopy: setAutoCopyState,
    setAutoDownload: setAutoDownloadState
  }), [
    feedbacks,
    draft,
    isActive,
    error,
    autoCopy,
    autoDownload,
    addFeedback,
    loadFeedbackFromStorage,
    updateFeedback,
    deleteFeedback,
    clearAllFeedbacks,
    saveDraft,
    clearDraft,
    restoreDraft,
    setActive,
    setAutoCopyState,
    setAutoDownloadState
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