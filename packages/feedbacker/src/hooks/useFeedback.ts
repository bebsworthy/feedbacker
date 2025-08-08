/**
 * useFeedback hook - Main hook for feedback operations
 * Integrates with context and storage for complete functionality
 */

import { useCallback } from 'react';
import { Feedback, Draft, ExportOptions, UseFeedbackResult } from '../types';
import { useFeedbackContext } from '../context/FeedbackContext';
import { MarkdownExporter } from '../export/MarkdownExporter';
import { ZipExporter } from '../export/ZipExporter';

export const useFeedback = (): UseFeedbackResult => {
  const {
    feedbacks,
    draft,
    addFeedback: addFeedbackToContext,
    deleteFeedback: deleteFeedbackFromContext,
    clearAllFeedbacks,
    setError
  } = useFeedbackContext();

  const addFeedback = useCallback((feedback: Feedback) => {
    try {
      addFeedbackToContext(feedback);
    } catch (error) {
      console.error('[Feedbacker] Failed to add feedback:', error);
      setError(error as Error);
    }
  }, [addFeedbackToContext, setError]);

  const deleteFeedback = useCallback((id: string) => {
    try {
      deleteFeedbackFromContext(id);
    } catch (error) {
      console.error('[Feedbacker] Failed to delete feedback:', error);
      setError(error as Error);
    }
  }, [deleteFeedbackFromContext, setError]);

  const clearAll = useCallback(() => {
    try {
      clearAllFeedbacks();
    } catch (error) {
      console.error('[Feedbacker] Failed to clear feedbacks:', error);
      setError(error as Error);
    }
  }, [clearAllFeedbacks, setError]);

  const exportFeedback = useCallback(async (options: ExportOptions): Promise<void> => {
    try {
      if (feedbacks.length === 0) {
        throw new Error('No feedback to export');
      }

      if (options.format === 'markdown') {
        const markdown = MarkdownExporter.exportAsMarkdown(feedbacks);
        
        // Create and download the markdown file
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
      } else if (options.format === 'zip') {
        const zipBlob = await ZipExporter.exportAsZip(feedbacks);
        
        // Create and download the zip file
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `feedback-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('[Feedbacker] Export failed:', error);
      setError(error as Error);
      throw error;
    }
  }, [feedbacks, setError]);

  return {
    feedbacks,
    draft,
    addFeedback,
    deleteFeedback,
    clearAll,
    exportFeedback
  };
};