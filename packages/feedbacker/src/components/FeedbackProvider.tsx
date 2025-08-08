/**
 * FeedbackProvider component - Main entry point for the feedback system
 * Provides error boundary protection and React version validation
 * Integrates all hooks and components for complete functionality
 */

import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { FeedbackProviderProps } from '../types';
import { FeedbackContextProvider } from '../context/FeedbackContext';
import { FAB } from './FAB/FAB';
import { FeedbackModal } from './FeedbackModal/FeedbackModal';
import { ManagerSidebar } from './ManagerSidebar/ManagerSidebar';
import { ComponentOverlay } from './ComponentOverlay';
import { useFeedbackStorage } from '../hooks/useFeedbackStorage';
import { useFeedbackEvent } from '../hooks/useFeedbackEvent';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary to prevent feedback system crashes from affecting host app
 */
class FeedbackErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('[Feedbacker] Error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Feedbacker] Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Silently disable feedback system on error to prevent app crashes
      return this.props.children;
    }

    return this.props.children;
  }
}

/**
 * React version compatibility checker
 */
const useReactVersionCheck = (): boolean => {
  const [isCompatible, setIsCompatible] = useState(true);

  useEffect(() => {
    try {
      // Check React version
      const reactVersion = React.version;
      const majorVersion = parseInt(reactVersion.split('.')[0], 10);
      
      if (majorVersion < 18) {
        console.warn(
          `[Feedbacker] React version ${reactVersion} detected. ` +
          'React 18 or higher is required. Feedback system will be disabled.'
        );
        setIsCompatible(false);
        return;
      }

      // Check for required React features
      if (!React.createContext || !React.useContext || !React.useState || !React.useEffect) {
        console.warn('[Feedbacker] Required React hooks not available. Feedback system will be disabled.');
        setIsCompatible(false);
        return;
      }

      setIsCompatible(true);
    } catch (error) {
      console.error('[Feedbacker] Error checking React compatibility:', error);
      setIsCompatible(false);
    }
  }, []);

  return isCompatible;
};

/**
 * Storage integration component
 */
const FeedbackStorageIntegration: React.FC<{ storageKey?: string }> = ({ storageKey }) => {
  // Initialize storage synchronization
  useFeedbackStorage(storageKey);
  return null; // This component only handles side effects
};

/**
 * Internal FeedbackProvider component
 */
const FeedbackProviderInternal: React.FC<FeedbackProviderProps> = ({
  children,
  position = 'bottom-right',
  primaryColor = '#3b82f6',
  enabled = true,
  storageKey = 'feedbacker',
  onFeedbackSubmit
}) => {
  const isReactCompatible = useReactVersionCheck();

  // If React is not compatible or system is disabled, just render children
  if (!isReactCompatible || !enabled) {
    return <>{children}</>;
  }

  return (
    <FeedbackContextProvider onFeedbackSubmit={onFeedbackSubmit}>
      <div 
        className="feedbacker-root"
        style={{
          '--fb-primary': primaryColor,
          '--fb-position': position
        } as React.CSSProperties & { [key: string]: string }}
      >
        {children}
        
        {/* Initialize storage synchronization */}
        <FeedbackStorageIntegration storageKey={storageKey} />
        
        {/* Component detection overlay */}
        <ComponentOverlay />
        
        {/* Feedback modal */}
        <FeedbackModal />
        
        {/* Manager sidebar */}
        <ManagerSidebar />
        
        {/* Floating Action Button */}
        <FAB position={position} />
      </div>
    </FeedbackContextProvider>
  );
};

/**
 * Main FeedbackProvider component with error boundary
 */
export const FeedbackProvider: React.FC<FeedbackProviderProps> = (props) => {
  return (
    <FeedbackErrorBoundary>
      <FeedbackProviderInternal {...props} />
    </FeedbackErrorBoundary>
  );
};