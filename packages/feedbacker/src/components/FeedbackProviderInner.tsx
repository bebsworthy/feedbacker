/**
 * FeedbackProviderInner - Component that uses ComponentDetectionContext
 * This component must be rendered inside ComponentDetectionProvider
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ComponentInfo, Feedback, Draft } from '../types';
import { FAB } from './FAB/FAB';
import { FeedbackModal } from './FeedbackModal/FeedbackModal';
import { FeedbackManager } from './ManagerSidebar/FeedbackManager';
import { ComponentOverlay } from './ComponentOverlay';
import { ExportDialog } from './ManagerSidebar/ExportDialog';
import { ConfirmDialog } from './ManagerSidebar/ConfirmDialog';
import { useFeedbackStorage } from '../hooks/useFeedbackStorage';
import { useFeedbackEvent } from '../hooks/useFeedbackEvent';
// import { useFeedback } from '../hooks/useFeedback'; // May be used in future
import { useComponentDetection } from '../context/ComponentDetectionContext';
import { useFeedbackContext } from '../context/FeedbackContext';
import { captureScreenshotWithAdapters as captureScreenshot } from '../utils/screenshot-adapter';
import { initializeCaptureManager } from '../utils/screenshot-adapter';
import { captureHtmlSnippet, formatHtmlSnippet } from '../utils/htmlSnippet';
import logger from '../utils/logger';

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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Context hooks (these require FeedbackContextProvider)
  const {
    feedbacks,
    draft,
    addFeedback,
    deleteFeedback,
    clearAllFeedbacks,
    saveDraft,
    clearDraft,
    captureLibrary,
    captureAdapter
  } = useFeedbackContext();

  // Storage synchronization
  useFeedbackStorage(storageKey);

  // Export functionality - may be used in future
  // const { exportFeedback } = useFeedback();

  // Component detection
  const { activate, deactivate, selectedComponent } = useComponentDetection();

  // Event system
  const { on } = useFeedbackEvent();

  // Initialize capture manager with configured library/adapter
  useEffect(() => {
    if (captureLibrary || captureAdapter) {
      initializeCaptureManager(captureLibrary, captureAdapter);
    }
  }, [captureLibrary, captureAdapter]);

  // Handle component selection
  useEffect(() => {
    if (selectedComponent && selectedComponent.element) {
      // Capture HTML snippet from the selected element
      const htmlSnippet = formatHtmlSnippet(captureHtmlSnippet(selectedComponent.element));

      // Add HTML snippet to component info
      const componentInfoWithHtml = {
        ...selectedComponent,
        htmlSnippet
      };

      // Capture screenshot when component is selected
      captureScreenshot(selectedComponent.element, {
        library: captureLibrary,
        adapter: captureAdapter
      })
        .then((result) => {
          setModalComponentInfo(componentInfoWithHtml);
          setModalScreenshot(result.dataUrl || null);
          setIsModalOpen(true);
          deactivate();
        })
        .catch((error) => {
          logger.error('Screenshot capture failed:', error);
          setModalComponentInfo(componentInfoWithHtml);
          setModalScreenshot(null);
          setIsModalOpen(true);
          deactivate();
        });
    }
  }, [selectedComponent, deactivate]);

  // Event listeners
  useEffect(() => {
    const unsubscribeSelectionStart = on('selection:start', () => {
      logger.debug('Starting component selection');
      logger.debug('Calling activate()');
      activate();
      logger.debug('After activate, isActive will update on next render');
    });

    const unsubscribeManagerOpen = on('manager:open', () => {
      logger.debug('Opening manager');
      setIsManagerOpen(true);
    });

    const unsubscribeDraftRestore = on('draft:restore', () => {
      logger.debug('Restoring draft');
      if (draft) {
        setModalComponentInfo(draft.componentInfo);
        setModalScreenshot(draft.screenshot || null);
        setIsModalOpen(true);
      }
    });

    const unsubscribeExportOpen = on('export:open', () => {
      logger.debug('Opening export dialog');
      setIsExportDialogOpen(true);
    });

    const unsubscribeClearConfirm = on('clearall:confirm', () => {
      logger.debug('Opening clear all confirmation');
      setIsConfirmClearOpen(true);
    });

    return () => {
      unsubscribeSelectionStart();
      unsubscribeManagerOpen();
      unsubscribeDraftRestore();
      unsubscribeExportOpen();
      unsubscribeClearConfirm();
    };
  }, [on, activate, draft]);

  // Modal handlers
  const handleModalSubmit = useCallback(
    (comment: string, screenshot?: string) => {
      if (!modalComponentInfo) {
        return;
      }

      if (editingFeedbackId) {
        // Update existing feedback
        const existingFeedback = feedbacks.find((f) => f.id === editingFeedbackId);
        if (existingFeedback) {
          const updatedFeedback: Feedback = {
            ...existingFeedback,
            comment,
            screenshot: screenshot || existingFeedback.screenshot,
            timestamp: new Date().toISOString(),
            htmlSnippet: (modalComponentInfo as any).htmlSnippet || existingFeedback.htmlSnippet
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
          },
          htmlSnippet: (modalComponentInfo as any).htmlSnippet || undefined
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
    },
    [
      modalComponentInfo,
      editingFeedbackId,
      feedbacks,
      addFeedback,
      deleteFeedback,
      onFeedbackSubmit,
      clearDraft
    ]
  );

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

  const handleModalSaveDraft = useCallback(
    (draft: Draft) => {
      saveDraft(draft.componentInfo, draft.comment, draft.screenshot);
    },
    [saveDraft]
  );

  // Manager handlers
  const handleManagerClose = useCallback(() => {
    setIsManagerOpen(false);
  }, []);

  const handleManagerExport = useCallback(
    async (format: 'markdown' | 'zip', feedbacksToExport?: Feedback[]) => {
      try {
        // If specific feedbacks provided, export those; otherwise export all
        const targetFeedbacks = feedbacksToExport || feedbacks;

        if (format === 'markdown') {
          const { MarkdownExporter } = await import('../export/MarkdownExporter');
          const markdown = MarkdownExporter.exportAsMarkdown(targetFeedbacks);
          const blob = new Blob([markdown], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `feedback-${new Date().toISOString().split('T')[0]}.md`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          const { ZipExporter } = await import('../export/ZipExporter');
          const zipBlob = await ZipExporter.exportAsZip(targetFeedbacks);
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
        logger.error('Export failed:', error);
      }
    },
    [feedbacks]
  );

  const handleEditFeedback = useCallback((feedback: Feedback) => {
    // Open modal with existing feedback data for editing
    setModalComponentInfo({
      name: feedback.componentName,
      path: feedback.componentPath,
      element: document.body, // Placeholder element
      htmlSnippet: feedback.htmlSnippet
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

      {/* Feedback Manager - Full screen */}
      <FeedbackManager
        isOpen={isManagerOpen}
        feedbacks={feedbacks}
        onClose={handleManagerClose}
        onDeleteFeedback={deleteFeedback}
        onEditFeedback={handleEditFeedback}
        onClearAll={clearAllFeedbacks}
        onExport={handleManagerExport}
      />

      {/* Export dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        feedbackCount={feedbacks.length}
        onExport={async (format) => {
          await handleManagerExport(format);
          setIsExportDialogOpen(false);
        }}
        onCancel={() => setIsExportDialogOpen(false)}
      />

      {/* Clear all confirmation */}
      <ConfirmDialog
        isOpen={isConfirmClearOpen}
        title="Clear All Feedback"
        message="Are you sure you want to delete all feedback? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={() => {
          clearAllFeedbacks();
          setIsConfirmClearOpen(false);
        }}
        onCancel={() => setIsConfirmClearOpen(false)}
      />

      {/* Floating Action Button */}
      <FAB position={position} />
    </>
  );
};
