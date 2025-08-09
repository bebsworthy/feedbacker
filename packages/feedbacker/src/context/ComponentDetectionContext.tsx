/**
 * ComponentDetectionContext
 * Provides shared component detection state across the application
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useComponentDetection as useComponentDetectionHook } from '../hooks/useComponentDetection';
import { UseComponentDetectionResult } from '../types';

const ComponentDetectionContext = createContext<UseComponentDetectionResult | null>(null);

export const ComponentDetectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const detection = useComponentDetectionHook();

  return (
    <ComponentDetectionContext.Provider value={detection}>
      {children}
    </ComponentDetectionContext.Provider>
  );
};

export const useComponentDetection = (): UseComponentDetectionResult => {
  const context = useContext(ComponentDetectionContext);
  if (!context) {
    throw new Error('useComponentDetection must be used within a ComponentDetectionProvider');
  }
  return context;
};
