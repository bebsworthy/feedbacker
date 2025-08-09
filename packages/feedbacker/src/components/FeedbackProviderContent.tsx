/**
 * FeedbackProviderContent - Wrapper that provides ComponentDetectionContext
 * This component wraps FeedbackProviderInner with the necessary context
 */

import React from 'react';
import { ComponentDetectionProvider } from '../context/ComponentDetectionContext';
import { FeedbackProviderInner } from './FeedbackProviderInner';
import { Feedback } from '../types';

interface FeedbackProviderContentProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  storageKey?: string;
  onFeedbackSubmit?: (feedback: Feedback) => void;
}

export const FeedbackProviderContent: React.FC<FeedbackProviderContentProps> = ({
  position = 'bottom-right',
  storageKey = 'feedbacker',
  onFeedbackSubmit
}) => {
  return (
    <ComponentDetectionProvider>
      <FeedbackProviderInner
        position={position}
        storageKey={storageKey}
        onFeedbackSubmit={onFeedbackSubmit}
      />
    </ComponentDetectionProvider>
  );
};
