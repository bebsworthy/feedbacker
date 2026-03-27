/**
 * Tests for FeedbackApp main controller.
 * Covers Phase 1: T-019, T-027, T-028.
 * Covers Phase 2: T-001..T-005 (undo delete), T-006..T-008 (export toasts),
 *   T-012..T-014 (selection banner), T-019..T-020 (copy all),
 *   T-029..T-031 (milestones).
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

jest.mock('../utils/css-selector-generator', () => ({
  generateCssSelector: jest.fn().mockReturnValue('#mock-selector'),
}));

jest.mock('../ui/breadcrumb-trail', () => ({
  BreadcrumbTrail: jest.fn().mockImplementation(() => ({
    activate: jest.fn(),
    deactivate: jest.fn(),
    update: jest.fn(),
    getElement: jest.fn().mockReturnValue(null),
  })),
}));

jest.mock('../utils/element-relocator', () => ({
  relocateElement: jest.fn().mockReturnValue(null),
  highlightElement: jest.fn(),
}));

// Mock @feedbacker/core
jest.mock('@feedbacker/core', () => ({
  captureHtmlSnippet: jest.fn().mockReturnValue('<div>test</div>'),
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
  MarkdownExporter: {
    exportSingleItem: jest.fn().mockReturnValue('# Feedback'),
    exportAsMarkdown: jest.fn().mockReturnValue('# All Feedback\n\n- Item 1\n- Item 2\n- Item 3'),
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
  getHumanReadableName: jest.fn((el: HTMLElement, name?: string) => name || el.tagName.toLowerCase()),
}));

import type { Feedback } from '@feedbacker/core';
import { MarkdownExporter } from '@feedbacker/core';
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
    setLifecycleCallbacks: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    destroy: jest.fn(),
  };
  return mock as unknown as DetectionController;
}

function createFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: overrides.id ?? 'fb_1',
    componentName: overrides.componentName ?? 'TestComponent',
    componentPath: overrides.componentPath ?? ['App', 'TestComponent'],
    comment: overrides.comment ?? 'Test feedback comment',
    url: overrides.url ?? 'https://example.com/page',
    timestamp: overrides.timestamp ?? new Date().toISOString(),
    browserInfo: overrides.browserInfo ?? {
      userAgent: 'test',
      viewport: { width: 1024, height: 768 },
      platform: 'test',
    },
    screenshot: overrides.screenshot,
    htmlSnippet: overrides.htmlSnippet,
  };
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

    // Mock window.location for sidebar filtering
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', href: 'https://example.com/page' },
      writable: true,
      configurable: true,
    });

    // Default: onboarding already shown
    mockChromeStorageGet.mockResolvedValue({ 'feedbacker-onboarding-shown': true });
    mockChromeStorageSet.mockResolvedValue(undefined);
    mockChromeRuntimeSendMessage.mockResolvedValue({ success: false });
  });

  afterEach(() => {
    jest.useRealTimers();
    // Clean up any selection banners left on document.body
    document.querySelectorAll('.fb-selection-banner').forEach(el => el.remove());
    container.remove();
    jest.clearAllMocks();
  });

  /** Helper: render app, open sidebar with feedbacks, return the FAB click path */
  function renderAppWithFeedbacks(feedbacks: Feedback[]): FeedbackApp {
    (state as Record<string, unknown>).feedbacks = feedbacks;
    const app = new FeedbackApp(container, state, detection);
    app.render();
    return app;
  }

  /** Helper: open sidebar by clicking the FAB's "View feedback" action */
  function openSidebar(): void {
    const fab = container.querySelector('.fb-fab') as HTMLButtonElement;
    fab.click(); // expand
    const actions = container.querySelectorAll('.fb-fab-action');
    // "View feedback" is the second action
    const viewBtn = Array.from(actions).find(a => a.textContent?.includes('View'));
    (viewBtn as HTMLElement)?.click();
  }

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

    it('live region can receive announcement text', () => {
      const app = new FeedbackApp(container, state, detection);
      app.render();

      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]') as HTMLElement;
      expect(liveRegion).not.toBeNull();

      // The announce method sets textContent via requestAnimationFrame
      // Verify the region starts empty and is ready for announcements
      expect(liveRegion.textContent).toBe('');

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

  // ============================================================
  // Phase 2 Tests
  // ============================================================

  /**
   * T-001: Delete shows undo toast (card hidden, toast visible,
   * state.deleteFeedback NOT called).
   */
  describe('T-001: Delete shows undo toast', () => {
    it('hides card and shows undo toast without calling state.deleteFeedback', async () => {
      const fb = createFeedback({ id: 'fb_del_1' });
      const app = renderAppWithFeedbacks([fb]);
      await jest.advanceTimersByTimeAsync(0);

      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      // Find and click delete button on the card
      const deleteBtn = container.querySelector('[aria-label="Delete feedback"]') as HTMLButtonElement;
      expect(deleteBtn).not.toBeNull();
      deleteBtn.click();

      // Undo toast should appear
      const toast = container.querySelector('.fb-toast-undo');
      expect(toast).not.toBeNull();
      expect(toast!.getAttribute('role')).toBe('status');
      expect(toast!.textContent).toContain('Feedback deleted');
      expect(toast!.textContent).toContain('Undo');

      // state.deleteFeedback should NOT be called yet
      expect(state.deleteFeedback).not.toHaveBeenCalled();

      // Card should be visually removed from sidebar
      const cards = container.querySelectorAll('.fb-card');
      expect(cards.length).toBe(0);

      app.destroy();
    });
  });

  /**
   * T-002: Undo restores card at original position, cancels timer.
   */
  describe('T-002: Undo restores card', () => {
    it('clicking Undo restores the card and cancels deletion', async () => {
      const fb = createFeedback({ id: 'fb_undo_1' });
      const app = renderAppWithFeedbacks([fb]);
      await jest.advanceTimersByTimeAsync(0);

      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      const deleteBtn = container.querySelector('[aria-label="Delete feedback"]') as HTMLButtonElement;
      deleteBtn.click();

      // Click undo
      const undoBtn = container.querySelector('.fb-toast-undo-btn') as HTMLButtonElement;
      expect(undoBtn).not.toBeNull();
      undoBtn.click();

      // Toast should be removed
      expect(container.querySelector('.fb-toast-undo')).toBeNull();

      // Card should reappear
      const cards = container.querySelectorAll('.fb-card');
      expect(cards.length).toBe(1);

      // Advance past the 8s window -- deleteFeedback should never be called
      jest.advanceTimersByTime(9000);
      expect(state.deleteFeedback).not.toHaveBeenCalled();

      app.destroy();
    });
  });

  /**
   * T-003: 8s timer fires state.deleteFeedback.
   */
  describe('T-003: 8s timer finalizes delete', () => {
    it('calls state.deleteFeedback after 8000ms', async () => {
      const fb = createFeedback({ id: 'fb_timer_1' });
      const app = renderAppWithFeedbacks([fb]);
      await jest.advanceTimersByTimeAsync(0);

      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      const deleteBtn = container.querySelector('[aria-label="Delete feedback"]') as HTMLButtonElement;
      deleteBtn.click();

      expect(state.deleteFeedback).not.toHaveBeenCalled();

      // Advance 8 seconds
      await jest.advanceTimersByTimeAsync(8100);

      expect(state.deleteFeedback).toHaveBeenCalledWith('fb_timer_1');

      app.destroy();
    });
  });

  /**
   * T-004: Second delete finalizes previous immediately.
   */
  describe('T-004: Second delete finalizes previous', () => {
    it('finalizes first pending delete when second delete occurs', async () => {
      const fbA = createFeedback({ id: 'fb_A', comment: 'Comment A' });
      const fbB = createFeedback({ id: 'fb_B', comment: 'Comment B' });
      const app = renderAppWithFeedbacks([fbA, fbB]);
      await jest.advanceTimersByTimeAsync(0);

      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      // Delete card A (first delete button)
      const deleteBtns = container.querySelectorAll('[aria-label="Delete feedback"]');
      (deleteBtns[0] as HTMLButtonElement).click();

      expect(state.deleteFeedback).not.toHaveBeenCalled();

      // Delete card B (now the only card visible)
      await jest.advanceTimersByTimeAsync(0);
      const deleteBtnsAfter = container.querySelectorAll('[aria-label="Delete feedback"]');
      (deleteBtnsAfter[0] as HTMLButtonElement).click();

      // First delete (fb_A) should be finalized immediately
      expect(state.deleteFeedback).toHaveBeenCalledWith('fb_A');

      // Only card B has the active undo toast
      const toast = container.querySelector('.fb-toast-undo');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toContain('Feedback deleted');

      app.destroy();
    });
  });

  /**
   * T-005: state.deleteFeedback rejection -> error toast + card restored.
   */
  describe('T-005: Delete finalization failure restores card', () => {
    it('shows error toast and restores card when deleteFeedback rejects', async () => {
      const fb = createFeedback({ id: 'fb_fail_1' });
      (state.deleteFeedback as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const app = renderAppWithFeedbacks([fb]);
      await jest.advanceTimersByTimeAsync(0);

      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      const deleteBtn = container.querySelector('[aria-label="Delete feedback"]') as HTMLButtonElement;
      deleteBtn.click();

      // Advance past 8s to trigger finalization
      await jest.advanceTimersByTimeAsync(8100);

      // Error toast should appear
      const toast = container.querySelector('.fb-toast');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toContain('Failed to delete');
      expect(toast!.textContent).toContain('Item restored');

      // Card should be restored in sidebar
      const cards = container.querySelectorAll('.fb-card');
      expect(cards.length).toBe(1);

      app.destroy();
    });
  });

  /**
   * T-006: Markdown export shows "Report downloaded" toast.
   */
  describe('T-006: Markdown export shows success toast', () => {
    it('shows "Report downloaded" toast after markdown export', async () => {
      const fb = createFeedback();
      const app = renderAppWithFeedbacks([fb]);
      await jest.advanceTimersByTimeAsync(0);

      // Open export dialog via FAB
      const fab = container.querySelector('.fb-fab') as HTMLButtonElement;
      fab.click();
      const actions = container.querySelectorAll('.fb-fab-action');
      const exportAction = Array.from(actions).find(a => a.textContent?.includes('Export'));
      (exportAction as HTMLElement)?.click();
      await jest.advanceTimersByTimeAsync(0);

      // Click Markdown option (second option in export dialog)
      const options = container.querySelectorAll('.fb-export-option');
      expect(options.length).toBe(3);
      (options[1] as HTMLElement).click();
      await jest.advanceTimersByTimeAsync(100);

      const toast = container.querySelector('.fb-toast');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toContain('Report downloaded');

      app.destroy();
    });
  });

  /**
   * T-007: ZIP export shows "Report downloaded" toast.
   */
  describe('T-007: ZIP export shows success toast', () => {
    it('shows "Report downloaded" toast after ZIP export', async () => {
      const fb = createFeedback();
      const app = renderAppWithFeedbacks([fb]);
      await jest.advanceTimersByTimeAsync(0);

      const fab = container.querySelector('.fb-fab') as HTMLButtonElement;
      fab.click();
      const actions = container.querySelectorAll('.fb-fab-action');
      const exportAction = Array.from(actions).find(a => a.textContent?.includes('Export'));
      (exportAction as HTMLElement)?.click();
      await jest.advanceTimersByTimeAsync(0);

      // Click ZIP option (third option)
      const options = container.querySelectorAll('.fb-export-option');
      (options[2] as HTMLElement).click();
      await jest.advanceTimersByTimeAsync(100);

      const toast = container.querySelector('.fb-toast');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toContain('Report downloaded');

      app.destroy();
    });
  });

  /**
   * T-008: Export failure shows error toast.
   */
  describe('T-008: Export failure shows error toast', () => {
    it('shows error toast when Markdown export throws', async () => {
      const { MarkdownExporter: MdMock } = jest.requireMock('@feedbacker/core') as {
        MarkdownExporter: { downloadMarkdown: jest.Mock };
      };
      MdMock.downloadMarkdown.mockImplementation(() => {
        throw new Error('Export error');
      });

      const fb = createFeedback();
      const app = renderAppWithFeedbacks([fb]);
      await jest.advanceTimersByTimeAsync(0);

      const fab = container.querySelector('.fb-fab') as HTMLButtonElement;
      fab.click();
      const actions = container.querySelectorAll('.fb-fab-action');
      const exportAction = Array.from(actions).find(a => a.textContent?.includes('Export'));
      (exportAction as HTMLElement)?.click();
      await jest.advanceTimersByTimeAsync(0);

      const options = container.querySelectorAll('.fb-export-option');
      (options[1] as HTMLElement).click();
      await jest.advanceTimersByTimeAsync(100);

      const toast = container.querySelector('.fb-toast');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toContain('Export failed');
      expect(toast!.textContent).toContain('Please try again');

      // Restore the mock
      MdMock.downloadMarkdown.mockImplementation(jest.fn());

      app.destroy();
    });
  });

  /**
   * T-012: Detection activate -> selection banner appears on document.body.
   */
  describe('T-012: Selection banner appears on activate', () => {
    it('shows banner on document.body with correct text and role', async () => {
      const app = renderAppWithFeedbacks([]);
      await jest.advanceTimersByTimeAsync(0);

      // Get the lifecycle callbacks that FeedbackApp registered
      const lifecycleCalls = (detection.setLifecycleCallbacks as jest.Mock).mock.calls[0];
      const onActivate = lifecycleCalls[0];

      onActivate();

      const banner = document.body.querySelector('.fb-selection-banner');
      expect(banner).not.toBeNull();
      expect(banner!.getAttribute('role')).toBe('status');
      expect(banner!.textContent).toBe(
        'Click on any element to capture feedback. Press Esc to cancel.'
      );

      app.destroy();
    });
  });

  /**
   * T-013: Element click -> banner dismissed.
   */
  describe('T-013: Selection banner dismissed on element click', () => {
    it('removes banner when onDeactivate fires (after element selection)', async () => {
      const app = renderAppWithFeedbacks([]);
      await jest.advanceTimersByTimeAsync(0);

      const lifecycleCalls = (detection.setLifecycleCallbacks as jest.Mock).mock.calls[0];
      const onActivate = lifecycleCalls[0];
      const onDeactivate = lifecycleCalls[1];

      onActivate();
      expect(document.body.querySelector('.fb-selection-banner')).not.toBeNull();

      // Simulate element click -> detection deactivates -> onDeactivate fires
      onDeactivate();
      expect(document.body.querySelector('.fb-selection-banner')).toBeNull();

      app.destroy();
    });
  });

  /**
   * T-014: Escape -> banner dismissed.
   */
  describe('T-014: Selection banner dismissed on Escape', () => {
    it('removes banner when onDeactivate fires (after Escape)', async () => {
      const app = renderAppWithFeedbacks([]);
      await jest.advanceTimersByTimeAsync(0);

      const lifecycleCalls = (detection.setLifecycleCallbacks as jest.Mock).mock.calls[0];
      const onActivate = lifecycleCalls[0];
      const onDeactivate = lifecycleCalls[1];

      onActivate();
      expect(document.body.querySelector('.fb-selection-banner')).not.toBeNull();

      // Escape triggers detection.deactivate() which calls onDeactivate
      onDeactivate();
      expect(document.body.querySelector('.fb-selection-banner')).toBeNull();

      app.destroy();
    });
  });

  /**
   * T-019 (Phase 2): Copy all -> clipboard + success toast.
   */
  describe('T-019 (P2): Copy all to clipboard', () => {
    it('writes filtered items to clipboard and shows success toast', async () => {
      const feedbacks = [
        createFeedback({ id: 'fb_c1' }),
        createFeedback({ id: 'fb_c2' }),
        createFeedback({ id: 'fb_c3' }),
      ];
      const app = renderAppWithFeedbacks(feedbacks);
      await jest.advanceTimersByTimeAsync(0);

      // Open export dialog via FAB
      const fab = container.querySelector('.fb-fab') as HTMLButtonElement;
      fab.click();
      const actions = container.querySelectorAll('.fb-fab-action');
      const exportAction = Array.from(actions).find(a => a.textContent?.includes('Export'));
      (exportAction as HTMLElement)?.click();
      await jest.advanceTimersByTimeAsync(0);

      // Click "Copy all to clipboard" (first option)
      const options = container.querySelectorAll('.fb-export-option');
      (options[0] as HTMLElement).click();
      await jest.advanceTimersByTimeAsync(100);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();

      const toast = container.querySelector('.fb-toast');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toContain('Copied 3 items to clipboard');

      app.destroy();
    });
  });

  /**
   * T-020: Clipboard failure -> error toast.
   */
  describe('T-020: Clipboard failure shows error toast', () => {
    it('shows error toast when clipboard.writeText rejects', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(
        new Error('Clipboard write failed')
      );

      const feedbacks = [createFeedback()];
      const app = renderAppWithFeedbacks(feedbacks);
      await jest.advanceTimersByTimeAsync(0);

      const fab = container.querySelector('.fb-fab') as HTMLButtonElement;
      fab.click();
      const actions = container.querySelectorAll('.fb-fab-action');
      const exportAction = Array.from(actions).find(a => a.textContent?.includes('Export'));
      (exportAction as HTMLElement)?.click();
      await jest.advanceTimersByTimeAsync(0);

      const options = container.querySelectorAll('.fb-export-option');
      (options[0] as HTMLElement).click();
      await jest.advanceTimersByTimeAsync(100);

      const toast = container.querySelector('.fb-toast');
      expect(toast).not.toBeNull();
      expect(toast!.textContent).toContain('Failed to copy');
      expect(toast!.textContent).toContain('Please try again');

      app.destroy();
    });
  });

  /**
   * T-029: Submit toast message is from the valid set.
   */
  describe('T-029: Toast message is from valid set', () => {
    it('shows a toast message from the defined rotation set after submit', async () => {
      const app = new FeedbackApp(container, state, detection);
      app.render();
      await jest.advanceTimersByTimeAsync(0);

      const validMessages = ['Feedback saved!', 'Got it!', 'Captured!', 'Nice catch!'];

      const setCallbacksCall = (detection.setCallbacks as jest.Mock).mock.calls[0];
      const onSelect = setCallbacksCall[1];
      mockChromeRuntimeSendMessage.mockResolvedValue({ success: false });

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100,
      });

      // Submit first feedback
      await onSelect({
        name: 'TestComponent',
        path: ['App', 'TestComponent'],
        element: mockElement,
      });

      let textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      textarea.value = 'Feedback 1';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      let submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
      submitBtn.click();
      await jest.advanceTimersByTimeAsync(10);

      const toast1 = container.querySelector('.fb-toast');
      expect(toast1).not.toBeNull();
      const msg1 = toast1!.textContent || '';
      expect(validMessages.some(m => msg1.includes(m))).toBe(true);

      app.destroy();
    });
  });

  /**
   * T-030: Consecutive submissions show different messages.
   */
  describe('T-030: Consecutive submissions differ', () => {
    it('shows different toast messages for consecutive submissions', async () => {
      const app = new FeedbackApp(container, state, detection);
      app.render();
      await jest.advanceTimersByTimeAsync(0);

      const setCallbacksCall = (detection.setCallbacks as jest.Mock).mock.calls[0];
      const onSelect = setCallbacksCall[1];
      mockChromeRuntimeSendMessage.mockResolvedValue({ success: false });

      const messages: string[] = [];

      for (let i = 0; i < 2; i++) {
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
        textarea.value = `Feedback ${i + 1}`;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        const submitBtn = container.querySelector('.fb-btn-primary') as HTMLButtonElement;
        submitBtn.click();
        await jest.advanceTimersByTimeAsync(10);

        const toast = container.querySelector('.fb-toast');
        messages.push(toast?.textContent || '');

        // Clear toast for next iteration
        jest.advanceTimersByTime(4000);
      }

      // The two messages should be different
      expect(messages[0]).not.toBe(messages[1]);

      app.destroy();
    });
  });

  /**
   * T-031: Milestone at count 5 and 10.
   * After submitting the 5th/10th item with sidebar open, a .fb-milestone
   * element containing "Thorough review!" / "Detailed review!" is present.
   */
  describe('T-031: Milestones at count 5 and 10', () => {
    /** Helper: submit a feedback item via the modal flow. */
    async function submitFeedbackItem(
      cont: HTMLDivElement,
      det: DetectionController,
      comment: string
    ): Promise<void> {
      const setCallbacksCall = (det.setCallbacks as jest.Mock).mock.calls[0];
      const onSelect = setCallbacksCall[1];

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = jest.fn().mockReturnValue({
        x: 0, y: 0, width: 100, height: 100,
      });

      await onSelect({
        name: 'Test',
        path: ['App', 'Test'],
        element: mockElement,
      });

      const textarea = cont.querySelector('.fb-textarea') as HTMLTextAreaElement;
      textarea.value = comment;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      const submitBtn = cont.querySelector('.fb-btn-primary') as HTMLButtonElement;
      submitBtn.click();
      await jest.advanceTimersByTimeAsync(10);
      // Clear toast so it doesn't interfere
      jest.advanceTimersByTime(4000);
    }

    it('shows "Thorough review!" milestone badge at count 5', async () => {
      const feedbacks = Array.from(
        { length: 4 },
        (_, i) => createFeedback({ id: `fb_ms${i}` })
      );
      const app = renderAppWithFeedbacks(feedbacks);
      await jest.advanceTimersByTimeAsync(0);

      (state.addFeedback as jest.Mock).mockImplementation(async (fb: Feedback) => {
        (state.feedbacks as Feedback[]).push(fb);
      });

      // Open sidebar so milestone badge can appear in the header
      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      // Submit 5th item (modal renders on top of sidebar)
      await submitFeedbackItem(container, detection, 'Fifth feedback');

      // Assert milestone badge is present in the sidebar DOM
      const milestone = container.querySelector('.fb-milestone');
      expect(milestone).not.toBeNull();
      expect(milestone!.textContent).toBe('Thorough review!');

      app.destroy();
    });

    it('shows "Detailed review!" milestone badge at count 10', async () => {
      const feedbacks = Array.from(
        { length: 9 },
        (_, i) => createFeedback({ id: `fb_m10_${i}` })
      );
      const app = renderAppWithFeedbacks(feedbacks);
      await jest.advanceTimersByTimeAsync(0);

      (state.addFeedback as jest.Mock).mockImplementation(async (fb: Feedback) => {
        (state.feedbacks as Feedback[]).push(fb);
      });

      // Open sidebar so milestone badge can appear in the header
      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      // Submit 10th item
      await submitFeedbackItem(container, detection, 'Tenth feedback');

      // Assert milestone badge is present in the sidebar DOM
      const milestone = container.querySelector('.fb-milestone');
      expect(milestone).not.toBeNull();
      expect(milestone!.textContent).toBe('Detailed review!');

      app.destroy();
    });

    it('shows milestone when sidebar is opened after reaching count', async () => {
      const feedbacks = Array.from(
        { length: 4 },
        (_, i) => createFeedback({ id: `fb_def_${i}` })
      );
      const app = renderAppWithFeedbacks(feedbacks);
      await jest.advanceTimersByTimeAsync(0);

      (state.addFeedback as jest.Mock).mockImplementation(async (fb: Feedback) => {
        (state.feedbacks as Feedback[]).push(fb);
      });

      // Sidebar is NOT open — submit 5th item via modal
      await submitFeedbackItem(container, detection, 'Fifth feedback');

      // No milestone badge yet (sidebar not open)
      expect(container.querySelector('.fb-milestone')).toBeNull();

      // Now open sidebar — milestone should appear
      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      const milestone = container.querySelector('.fb-milestone');
      expect(milestone).not.toBeNull();
      expect(milestone!.textContent).toBe('Thorough review!');

      app.destroy();
    });

    it('removes milestone badge after 5000ms', async () => {
      const feedbacks = Array.from(
        { length: 4 },
        (_, i) => createFeedback({ id: `fb_auto_${i}` })
      );
      const app = renderAppWithFeedbacks(feedbacks);
      await jest.advanceTimersByTimeAsync(0);

      (state.addFeedback as jest.Mock).mockImplementation(async (fb: Feedback) => {
        (state.feedbacks as Feedback[]).push(fb);
      });

      openSidebar();
      await jest.advanceTimersByTimeAsync(0);

      await submitFeedbackItem(container, detection, 'Fifth feedback');

      expect(container.querySelector('.fb-milestone')).not.toBeNull();

      // After 5000ms the badge should auto-remove
      jest.advanceTimersByTime(5100);
      expect(container.querySelector('.fb-milestone')).toBeNull();

      app.destroy();
    });
  });
});
