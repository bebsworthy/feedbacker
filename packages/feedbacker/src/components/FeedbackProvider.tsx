/**
 * FeedbackProvider component - Main entry point for the feedback system
 * Provides error boundary protection and React version validation
 * Integrates all hooks and components for complete functionality
 */

import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { FeedbackProviderProps } from '../types';
import { FeedbackProviderInternal } from './FeedbackProviderInternal';
import logger from '../utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary to prevent feedback system crashes from affecting host app
 */
class FeedbackErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    logger.error('Error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error details:', error, errorInfo);
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
        logger.warn(
          `React version ${reactVersion} detected. ` +
            'React 18 or higher is required. Feedback system will be disabled.'
        );
        setIsCompatible(false);
        return;
      }

      // Check for required React features
      if (!React.createContext || !React.useContext || !React.useState || !React.useEffect) {
        logger.warn('Required React hooks not available. Feedback system will be disabled.');
        setIsCompatible(false);
        return;
      }

      setIsCompatible(true);
    } catch (error) {
      logger.error('Error checking React compatibility:', error);
      setIsCompatible(false);
    }
  }, []);

  return isCompatible;
};

/**
 * Main FeedbackProvider component with error boundary
 */
export const FeedbackProvider: React.FC<FeedbackProviderProps> = (props) => {
  const isReactCompatible = useReactVersionCheck();

  return (
    <FeedbackErrorBoundary>
      <FeedbackProviderInternal {...props} isReactCompatible={isReactCompatible} />
    </FeedbackErrorBoundary>
  );
};
