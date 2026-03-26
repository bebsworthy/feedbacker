/**
 * Background Service Worker for Feedbacker Extension
 * Handles: toolbar icon click activation, screenshot capture, messaging
 */

import { captureVisibleTab } from './screenshot';

// Track which tabs have the content script injected
const activeTabs = new Set<number>();

/**
 * Handle toolbar icon click — inject content script if not already active
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // Toggle: if already active, send deactivate message
  if (activeTabs.has(tab.id)) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
    } catch {
      // Tab might have navigated; remove and re-inject
      activeTabs.delete(tab.id);
      await injectContentScript(tab.id);
    }
    return;
  }

  await injectContentScript(tab.id);
});

/**
 * Inject the content script and detection bridge into a tab
 */
async function injectContentScript(tabId: number): Promise<void> {
  try {
    // Inject content script into the isolated world
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['dist/content/content-script.js']
    });

    activeTabs.add(tabId);
  } catch (error) {
    console.error('[Feedbacker] Failed to inject content script:', error);
  }
}

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'capture-screenshot') {
    captureVisibleTab()
      .then((dataUrl) => sendResponse({ success: true, dataUrl }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (message.type === 'inject-detection-bridge') {
    if (sender.tab?.id) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ['dist/content/detection-bridge.js'],
        world: 'MAIN'
      }).catch((error) => {
        console.error('[Feedbacker] Failed to inject detection bridge:', error);
      });
    }
    return false;
  }

  if (message.type === 'content-script-unloaded') {
    if (sender.tab?.id) {
      activeTabs.delete(sender.tab.id);
    }
    return false;
  }

  if (message.type === 'get-feedback-count') {
    chrome.storage.local.get('feedbacker-store').then((result) => {
      const store = result['feedbacker-store'];
      const count = store?.feedbacks?.length || 0;
      sendResponse({ count });
    });
    return true;
  }

  return false;
});

/**
 * Handle keyboard shortcut (Alt+Shift+F)
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-feedbacker') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    if (activeTabs.has(tab.id)) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'toggle' });
      } catch {
        activeTabs.delete(tab.id);
        await injectContentScript(tab.id);
      }
    } else {
      await injectContentScript(tab.id);
    }
  }
});

/**
 * Update badge count when storage changes
 */
chrome.storage.onChanged.addListener((changes) => {
  if (changes['feedbacker-store']) {
    const store = changes['feedbacker-store'].newValue;
    const count = store?.feedbacks?.length || 0;
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
  }
});

// Set initial badge on startup
chrome.storage.local.get('feedbacker-store').then((result) => {
  const count = result['feedbacker-store']?.feedbacks?.length || 0;
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
});

/**
 * Clean up when a tab is closed
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
});

/**
 * Clean up when a tab navigates (content script loses context)
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    activeTabs.delete(tabId);
  }
});
