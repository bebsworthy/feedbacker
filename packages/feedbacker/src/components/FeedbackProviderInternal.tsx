/**
 * Internal FeedbackProvider component
 * Wraps children with context and renders feedback components
 */

import React from 'react';
import { FeedbackProviderProps } from '../types';
import { FeedbackContextProvider } from '../context/FeedbackContext';
import { FeedbackProviderContent } from './FeedbackProviderContent';

interface FeedbackProviderInternalProps extends FeedbackProviderProps {
  isReactCompatible: boolean;
}

export const FeedbackProviderInternal: React.FC<FeedbackProviderInternalProps> = ({
  children,
  position = 'bottom-right',
  primaryColor = '#3b82f6',
  enabled = true,
  storageKey = 'feedbacker',
  onFeedbackSubmit,
  autoCopy,
  autoDownload,
  captureLibrary,
  captureAdapter,
  isReactCompatible
}) => {
  // If React is not compatible or system is disabled, just render children
  if (!isReactCompatible || !enabled) {
    return <>{children}</>;
  }

  return (
    <FeedbackContextProvider
      onFeedbackSubmit={onFeedbackSubmit}
      autoCopy={autoCopy}
      autoDownload={autoDownload}
      captureLibrary={captureLibrary}
      captureAdapter={captureAdapter}
    >
      <div
        className="feedbacker-root"
        style={
          {
            '--fb-primary': primaryColor,
            '--fb-position': position
          } as React.CSSProperties & { [key: string]: string }
        }
      >
        {children}

        {/* All feedback UI components */}
        <FeedbackProviderContent
          position={position}
          storageKey={storageKey}
          onFeedbackSubmit={onFeedbackSubmit}
        />
      </div>
    </FeedbackContextProvider>
  );
};
