/**
 * EventBridge Component
 * Connects the event system with component selection and UI state
 */

import { useEffect } from 'react';
import { useFeedbackEvent } from '../hooks/useFeedbackEvent';
import { useComponentDetection } from '../hooks/useComponentDetection';
import { useFeedbackContext } from '../context/FeedbackContext';

interface EventBridgeProps {
  onOpenModal: () => void;
  onOpenManager: () => void;
}

export const EventBridge: React.FC<EventBridgeProps> = ({ onOpenModal, onOpenManager }) => {
  const { on, emit } = useFeedbackEvent();
  const { activate, deactivate, selectedComponent } = useComponentDetection();
  const { draft } = useFeedbackContext();

  useEffect(() => {
    // Handle selection start event from FAB
    const unsubscribeSelectionStart = on('selection:start', () => {
      console.log('[EventBridge] Selection start received');
      activate();
    });

    // Handle selection cancel
    const unsubscribeSelectionCancel = on('selection:cancel', () => {
      console.log('[EventBridge] Selection cancel received');
      deactivate();
    });

    // Handle manager open
    const unsubscribeManagerOpen = on('manager:open', () => {
      console.log('[EventBridge] Manager open received');
      onOpenManager();
    });

    // Handle draft restore
    const unsubscribeDraftRestore = on('draft:restore', () => {
      console.log('[EventBridge] Draft restore received');
      if (draft) {
        onOpenModal();
      }
    });

    return () => {
      unsubscribeSelectionStart();
      unsubscribeSelectionCancel();
      unsubscribeManagerOpen();
      unsubscribeDraftRestore();
    };
  }, [on, activate, deactivate, onOpenModal, onOpenManager, draft]);

  // When a component is selected, open the modal
  useEffect(() => {
    if (selectedComponent) {
      console.log('[EventBridge] Component selected:', selectedComponent);
      emit('modal:open', { componentInfo: selectedComponent });
      onOpenModal();
      deactivate();
    }
  }, [selectedComponent, emit, onOpenModal, deactivate]);

  return null;
};