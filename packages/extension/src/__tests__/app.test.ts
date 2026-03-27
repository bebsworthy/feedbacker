/**
 * Tests for FeedbackApp main controller.
 * Covers T-019, T-027, T-028.
 *
 * FeedbackApp is heavily wired to StateManager, DetectionController,
 * and chrome.* APIs. We mock these dependencies and test the DOM output.
 */

// Set up chrome mock before imports
const mockChromeStorageGet = jest.fn();
const mockChromeStorageSet = jest.fn();
const mockChromeRuntimeSendMessage = jest.fn();

Object.assign(global, {
  chrome: {
    storage: {
      local: {
        get: mockChromeStorageGet,
        set: mockChromeStorageSet,
      },
    },
    runtime: {
      sendMessage: mockChromeRuntimeSendMessage,
    },
  },
});

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    write: jest.fn().mockResolvedValue(undefined),
  },
});

// Mock @feedbacker/core
jest.mock('@feedbacker/core', () => ({
  captureHtmlSnippet: jest.fn().mockReturnValue('<div>test</div>'),
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
  MarkdownExporter: {
    exportSingleItem: jest.fn().mockReturnValue('# Feedback'),
    downloadMarkdown: jest.fn(),
    generateFilename: jest.fn().mockReturnValue('feedback.md'),
  },
  ZipExporter: {
    downloadZip: jest.fn().mockResolvedValue(undefined),
    generateZipFilename: jest.fn().mockReturnValue('feedback.zip'),
  },
  FeedbackEventEmitter: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  formatDistanceToNow: jest.fn().mockReturnValue('just now'),
}));

// Mock @feedbacker/detection
jest.mock('@feedbacker/detection', () => ({
  createDetector: jest.fn().mockReturnValue({
    detect: jest.fn(),
  }),
  throttle: jest.fn((fn: Function) => fn),
}));

import { FeedbackApp } from '../ui/app';
import { StateManager } from '../core/state-manager';
import { DetectionController } from '../core/detection-controller';

function createMockStateManager(): StateManager {
  const mock = {
    feedbacks: [],
    draft: null,
    isActive: false,
    events: { emit: jest.fn(), on: jest.fn(), off: jest.fn() },
    init: jest.fn().mockResolvedValue(undefined),
    addFeedback: jest.fn().mockResolvedValue(undefined),
    deleteFeedback: jest.fn().mockResolvedValue(undefined),
    clearAll: jest.fn().mockResolvedValue(undefined),
    saveDraft: jest.fn().mockResolvedValue(undefined),
    clearDraft: jest.fn().mockResolvedValue(undefined),
  };
  return mock as unknown as StateManager;
}

function createMockDetectionController(): DetectionController {
  const mock = {
    isActive: false,
    hoveredComponent: null,
    selectedComponent: null,
    setCallbacks: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    destroy: jest.fn(),
  };
  return mock as unknown as DetectionController;
}

describe('FeedbackApp', () => {
  let container: HTMLDivElement;
  let state: StateManager;
  let detection: DetectionController;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    state = createMockStateManager();
    detection = createMockDetectionController();

    // Default: onboarding already shown
    mockChromeStorageGet.mockResolvedValue({ 'feedbacker-onboarding-shown': true });
    mockChromeStorageSet.mockResolvedValue(undefined);
    mockChromeRuntimeSendMessage.mockResolvedValue({ success: false });
  });

  afterEach(() => {
    jest.useRealTimers();
    container.remove();
    jest.clearAllMocks();
  });

  /**
   * T-019: ARIA live region exists and announces.
   * Live region element exists with role="status" and aria-live="polite".
   */
  describe('T-019: ARIA live region', () => {
    it('creates a live region with role="status" and aria-live="polite"', () => {
      const app = new FeedbackApp(container, state, detection);
      app.render();

      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(liveRegion).not.toBeNull();

      app.destroy();
    });

    it('live region is visually hidden', () => {
      const app = new FeedbackApp(container, state, detection);
      app.render();

      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
      expect(liveRegion).not.toBeNull();
      // Should have clipping styles for visual hiding
      expect(liveRegion.style.width).toBe('1px');
      expect(liveRegion.style.height).toBe('1px');
      expect(liveRegion.style.overflow).toBe('hidden');

      app.destroy();
    });
  });

  /**
   * T-027: Coach mark shows on first use, not on subsequent.
   * When chrome.storage.local.get returns empty, coach mark element appears.
   * After dismiss, chrome.storage.local.set called with feedbacker-onboarding-shown: true.
   * When storage returns true, no coach mark element.
   */
  describe('T-027: Coach mark first-use behavior', () => {
    it('shows coach mark when onboarding flag is not set', async () => {
      mockChromeStorageGet.mockResolvedValue({});

      const app = new FeedbackApp(container, state, detection);
      app.render();

      // Let the promise resolve
      await jest.advanceTimersByTimeAsync(0);

      const coachMark = container.querySelector('.fb-coach-mark');
      expect(coachMark).not.toBeNull();
      expect(coachMark!.textContent).toBe('Click to start giving feedback');

      app.destroy();
    });

    it('does NOT show coach mark when onboarding flag is true', async () => {
      mockChromeStorageGet.mockResolvedValue({ 'feedbacker-onboarding-shown': true });

      const app = new FeedbackApp(container, state, detection);
      app.render();

      await jest.advanceTimersByTimeAsync(0);

      const coachMark = container.querySelector('.fb-coach-mark');
      expect(coachMark).toBeNull();

      app.destroy();
    });

    it('dismisses coach mark after 8 seconds and sets storage flag', async () => {
      mockChromeStorageGet.mockResolvedValue({});

      const app = new FeedbackApp(container, state, detection);
      app.render();

      await jest.advanceTimersByTimeAsync(0);

      let coachMark = container.querySelector('.fb-coach-mark');
      expect(coachMark).not.toBeNull();

      // Wait 8 seconds for auto-dismiss
      jest.advanceTimersByTime(8100);

      coachMark = container.querySelector('.fb-coach-mark');
      expect(coachMark).toBeNull();

      expect(mockChromeStorageSet).toHaveBeenCalledWith({
        'feedbacker-onboarding-shown': true,
      });

      app.destroy();
    });

    it('shows coach mark on storage error (treat as not shown)', async () => {
      mockChromeStorageGet.mockRejectedValue(new Error('storage error'));

      const app = new FeedbackApp(container, state, detection);
      app.render();

      await jest.advanceTimersByTimeAsync(0);

      const coachMark = container.querySelector('.fb-coach-mark');
      expect(coachMark).not.toBeNull();

      app.destroy();
    });
  });

  /**
   * T-028: Toast appears on submit and auto-dismisses.
   * After submit, .fb-toast element exists with role="status",
   * contains "Feedback saved!". After 3500ms, element is removed.
   */
  describe('T-028: Toast on submit', () => {
    it('shows toast with "Feedback saved!" after feedback submission', async () => {
      const app = new FeedbackApp(container, state, detection);
      app.render();

      await jest.advanceTimersByTimeAsync(0);

      // Simulate: start capture, then simulate component selection by
      // triggering the onSelect callback that was passed to detection
      const setCallbacksCall = (detection.setCallbacks as jest.Mock).mock.calls[0];
      const onSelect = setCallbacksCall[1];

      // Mock the screenshot response
      mockChromeRuntimeSendMessage.mockResolvedValue({ success: false });

      // Trigger component selection
      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100,
      });

      await onSelect({
        name: 'TestComponent',
        path: ['App', 'TestComponent'],
        element: mockElement,
      });

      // Now a modal should be open. Find the textarea and submit.
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      expect(textarea).not.toBeNull();
      textarea.value = 'Test feedback';
      // Fire input event to enable the submit button
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Use the submit button
      const submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
      expect(submitBtn).not.toBeNull();
      expect(submitBtn.disabled).toBe(false);
      submitBtn.click();

      // Wait for async addFeedback to resolve
      await jest.advanceTimersByTimeAsync(10);

      const toast = container.querySelector('.fb-toast');
      expect(toast).not.toBeNull();
      expect(toast!.getAttribute('role')).toBe('status');
      expect(toast!.textContent).toContain('Feedback saved!');

      app.destroy();
    });

    it('auto-removes toast after 3500ms', async () => {
      const app = new FeedbackApp(container, state, detection);
      app.render();

      await jest.advanceTimersByTimeAsync(0);

      // Trigger selection
      const setCallbacksCall = (detection.setCallbacks as jest.Mock).mock.calls[0];
      const onSelect = setCallbacksCall[1];

      mockChromeRuntimeSendMessage.mockResolvedValue({ success: false });

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100,
      });

      await onSelect({
        name: 'TestComponent',
        path: ['App', 'TestComponent'],
        element: mockElement,
      });

      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      textarea.value = 'Test feedback';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      const submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
      submitBtn.click();

      // Wait for async addFeedback to resolve
      await jest.advanceTimersByTimeAsync(10);

      // Toast is present
      expect(container.querySelector('.fb-toast')).not.toBeNull();

      // After 3500ms, toast should be removed
      jest.advanceTimersByTime(3600);
      expect(container.querySelector('.fb-toast')).toBeNull();

      app.destroy();
    });
  });
});
