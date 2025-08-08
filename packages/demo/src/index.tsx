/**
 * Demo application entry point
 * Showcases the @feedbacker/core library with comprehensive examples
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Get the root element
const container = document.getElementById('app');
if (!container) {
  throw new Error('Root container not found');
}

// Create root and render the app
const root = createRoot(container);
root.render(<App />);