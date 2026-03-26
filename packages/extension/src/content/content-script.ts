/**
 * Content Script — bootstraps the Feedbacker extension UI
 * Injected via chrome.scripting.executeScript when user clicks toolbar icon
 */

import { ShadowHost } from './shadow-host';
import { ChromeStorageManager } from '../core/chrome-storage';
import { StateManager } from '../core/state-manager';
import { DetectionController } from '../core/detection-controller';
import { FeedbackApp } from '../ui/app';
import { logger } from '@feedbacker/core';

const SETTINGS_KEY = 'feedbacker-settings';

// Prevent double-injection (check both window flag and DOM)
if (!(window as any).__feedbacker_extension_loaded && !document.getElementById('feedbacker-extension-root')) {
  (window as any).__feedbacker_extension_loaded = true;
  init();
}

async function init(): Promise<void> {
  logger.debug('Feedbacker extension initializing');

  // Load settings
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const settings = result[SETTINGS_KEY] || {};

  // Create the shadow DOM host
  const shadowHost = new ShadowHost();
  const container = shadowHost.getContainer();

  // Apply custom primary color to shadow DOM
  if (settings.primaryColor) {
    const root = shadowHost.getShadowRoot();
    (root.host as HTMLElement).style.setProperty('--fb-primary', settings.primaryColor);
  }

  // Create storage and state
  const storage = new ChromeStorageManager();
  const state = new StateManager(storage);
  const detection = new DetectionController();

  // Create the main app
  const app = new FeedbackApp(container, state, detection);

  // Initialize state from storage, then show the app
  await state.init();
  app.render(settings);
  logger.debug('Feedbacker extension ready');

  // Listen for toggle messages from the background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'toggle') {
      app.toggle();
    }
    return false;
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes[SETTINGS_KEY]) {
      const newSettings = changes[SETTINGS_KEY].newValue || {};
      app.applySettings(newSettings);
      if (newSettings.primaryColor) {
        (shadowHost.getShadowRoot().host as HTMLElement).style.setProperty('--fb-primary', newSettings.primaryColor);
      }
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    app.destroy();
    shadowHost.destroy();
    detection.destroy();
    try {
      chrome.runtime.sendMessage({ type: 'content-script-unloaded' });
    } catch {
      // Extension context may already be invalidated
    }
  });
}
