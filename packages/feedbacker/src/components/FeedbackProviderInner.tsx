/**
 * FeedbackProviderInner - Component that uses ComponentDetectionContext
 * This component must be rendered inside ComponentDetectionProvider
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ComponentInfo, Feedback, Draft } from '../types';
import { FAB } from './FAB/FAB';
import { FeedbackModal } from './FeedbackModal/FeedbackModal';
import { ManagerSidebar } from './ManagerSidebar/ManagerSidebar';
import { ComponentOverlay } from './ComponentOverlay';
import { useFeedbackStorage } from '../hooks/useFeedbackStorage';
import { useFeedbackEvent } from '../hooks/useFeedbackEvent';
import { useComponentDetection } from '../context/ComponentDetectionContext';
import { useFeedbackContext } from '../context/FeedbackContext';
import { captureScreenshotWithFallback as captureScreenshot } from '../utils/screenshot';

interface FeedbackProviderInnerProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  storageKey?: string;
  onFeedbackSubmit?: (feedback: Feedback) => void;
}

export const FeedbackProviderInner: React.FC<FeedbackProviderInnerProps> = ({
  position = 'bottom-right',
  storageKey = 'feedbacker',
  onFeedbackSubmit
}) => {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalMinimized, setIsModalMinimized] = useState(false);
  const [modalComponentInfo, setModalComponentInfo] = useState<ComponentInfo | null>(null);
  const [modalScreenshot, setModalScreenshot] = useState<string | null>(null);
  const [modalInitialComment, setModalInitialComment] = useState<string>('');
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  
  // Manager sidebar state
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  
  // Context hooks (these require FeedbackContextProvider)
  const { 
    feedbacks, 
    draft, 
    addFeedback, 
    deleteFeedback, 
    clearAllFeedbacks, 
    saveDraft, 
    clearDraft 
  } = useFeedbackContext();
  
  // Storage synchronization
  useFeedbackStorage(storageKey);
  
  // Component detection
  const { activate, deactivate, selectedComponent } = useComponentDetection();
  
  // Event system
  const { on, emit } = useFeedbackEvent();

  // Handle component selection
  useEffect(() => {
    if (selectedComponent && selectedComponent.element) {
      // Capture screenshot when component is selected
      captureScreenshot(selectedComponent.element).then(result => {
        setModalComponentInfo(selectedComponent);
        setModalScreenshot(result.dataUrl);
        setIsModalOpen(true);
        deactivate();
      }).catch(error => {
        console.error('[Feedbacker] Screenshot capture failed:', error);
        setModalComponentInfo(selectedComponent);
        setModalScreenshot(null);
        setIsModalOpen(true);
        deactivate();
      });
    }
  }, [selectedComponent, deactivate]);

  // Event listeners
  useEffect(() => {
    const unsubscribeSelectionStart = on('selection:start', () => {
      console.log('[FeedbackProvider] Starting component selection');
      console.log('[FeedbackProvider] Calling activate()');
      activate();
      console.log('[FeedbackProvider] After activate, isActive will update on next render');
    });

    const unsubscribeManagerOpen = on('manager:open', () => {
      console.log('[FeedbackProvider] Opening manager');
      setIsManagerOpen(true);
    });

    const unsubscribeDraftRestore = on('draft:restore', () => {
      console.log('[FeedbackProvider] Restoring draft');
      if (draft) {
        setModalComponentInfo(draft.componentInfo);
        setModalScreenshot(draft.screenshot || null);
        setIsModalOpen(true);
      }
    });

    return () => {
      unsubscribeSelectionStart();
      unsubscribeManagerOpen();
      unsubscribeDraftRestore();
    };
  }, [on, activate, draft]);

  // Modal handlers
  const handleModalSubmit = useCallback((comment: string, screenshot?: string) => {
    if (!modalComponentInfo) return;

    if (editingFeedbackId) {
      // Update existing feedback
      const existingFeedback = feedbacks.find(f => f.id === editingFeedbackId);
      if (existingFeedback) {
        const updatedFeedback: Feedback = {
          ...existingFeedback,
          comment,
          screenshot: screenshot || existingFeedback.screenshot,
          timestamp: new Date().toISOString()
        };
        // Delete old and add updated
        deleteFeedback(editingFeedbackId);
        addFeedback(updatedFeedback);
        onFeedbackSubmit?.(updatedFeedback);
      }
    } else {
      // Create new feedback
      const feedback: Feedback = {
        id: `fb-${Date.now()}`,
        componentName: modalComponentInfo.name,
        componentPath: modalComponentInfo.path,
        comment,
        screenshot,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        browserInfo: {
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          screen: {
            width: screen.width,
            height: screen.height
          }
        }
      };
      addFeedback(feedback);
      onFeedbackSubmit?.(feedback);
    }

    clearDraft();
    setIsModalOpen(false);
    setIsModalMinimized(false);
    setModalComponentInfo(null);
    setModalScreenshot(null);
    setModalInitialComment('');
    setEditingFeedbackId(null);
  }, [modalComponentInfo, editingFeedbackId, feedbacks, addFeedback, deleteFeedback, onFeedbackSubmit, clearDraft]);

  const handleModalCancel = useCallback(() => {
    setIsModalOpen(false);
    setIsModalMinimized(false);
    setModalComponentInfo(null);
    setModalScreenshot(null);
    setModalInitialComment('');
    setEditingFeedbackId(null);
  }, []);

  const handleModalMinimize = useCallback(() => {
    setIsModalMinimized(true);
  }, []);

  const handleModalRestore = useCallback(() => {
    setIsModalMinimized(false);
  }, []);

  const handleModalSaveDraft = useCallback((draft: Draft) => {
    saveDraft(draft.componentInfo, draft.comment, draft.screenshot);
  }, [saveDraft]);

  // Manager handlers
  const handleManagerClose = useCallback(() => {
    setIsManagerOpen(false);
  }, []);

  const handleManagerExport = useCallback(async (format: 'markdown' | 'zip') => {
    emit('feedback:export', { format, feedbacks });
  }, [emit, feedbacks]);

  const handleEditFeedback = useCallback((feedback: Feedback) => {
    // Open modal with existing feedback data for editing
    setModalComponentInfo({
      name: feedback.componentName,
      path: feedback.componentPath,
      element: document.body // Placeholder element
    });
    setModalScreenshot(feedback.screenshot || null);
    setModalInitialComment(feedback.comment);
    setEditingFeedbackId(feedback.id);
    setIsModalOpen(true);
    setIsManagerOpen(false);
  }, []);

  return (
    <>
      {/* Component detection overlay */}
      <ComponentOverlay />
      
      {/* Feedback modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        isMinimized={isModalMinimized}
        componentInfo={modalComponentInfo}
        screenshot={modalScreenshot}
        initialComment={editingFeedbackId ? modalInitialComment : draft?.comment}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
        onMinimize={handleModalMinimize}
        onRestore={handleModalRestore}
        onSaveDraft={handleModalSaveDraft}
      />
      
      {/* Manager sidebar */}
      <ManagerSidebar
        isOpen={isManagerOpen}
        feedbacks={feedbacks}
        onClose={handleManagerClose}
        onDeleteFeedback={deleteFeedback}
        onEditFeedback={handleEditFeedback}
        onClearAll={clearAllFeedbacks}
        onExport={handleManagerExport}
      />
      
      {/* Floating Action Button */}
      <FAB position={position} />
    </>
  );
};