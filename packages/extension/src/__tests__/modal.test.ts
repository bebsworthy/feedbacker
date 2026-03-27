/**
 * Tests for FeedbackModal component.
 * Covers T-004, T-005, T-006, T-007, T-008, T-010, T-013, T-015.
 */

import { FeedbackModal } from '../ui/modal';

// Mock navigator.platform for OS-detection
const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

function mockPlatform(value: string): void {
  Object.defineProperty(navigator, 'platform', {
    value,
    writable: true,
    configurable: true,
  });
}

function restorePlatform(): void {
  if (originalPlatform) {
    Object.defineProperty(navigator, 'platform', originalPlatform);
  }
}

function createComponentInfo(overrides: Partial<{ name: string; path: string[] }> = {}) {
  return {
    name: overrides.name ?? 'TestButton',
    path: overrides.path ?? ['App', 'Layout', 'TestButton'],
    element: document.createElement('div'),
  };
}

describe('FeedbackModal', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    restorePlatform();
  });

  function createModal(overrides: Partial<{
    componentInfo: ReturnType<typeof createComponentInfo>;
    screenshot: string;
    draftComment: string;
    onSubmit: jest.Mock;
    onCancel: jest.Mock;
    onMinimize: jest.Mock;
    onDraftSave: jest.Mock;
  }> = {}) {
    return new FeedbackModal(container, {
      componentInfo: overrides.componentInfo ?? createComponentInfo(),
      screenshot: overrides.screenshot,
      draftComment: overrides.draftComment,
      onSubmit: overrides.onSubmit ?? jest.fn(),
      onCancel: overrides.onCancel ?? jest.fn(),
      onMinimize: overrides.onMinimize ?? jest.fn(),
      onDraftSave: overrides.onDraftSave ?? jest.fn(),
    });
  }

  /**
   * T-004: Modal component path is always visible.
   */
  describe('T-004: Modal component path always visible', () => {
    it('shows component path without needing to expand a toggle', () => {
      const modal = createModal();

      const pathEl = container.querySelector('.fb-component-path');
      expect(pathEl).not.toBeNull();
      expect(pathEl!.textContent).toContain('App > Layout > TestButton');

      modal.destroy();
    });
  });

  /**
   * T-005: Plain Enter in textarea does NOT submit.
   * Dispatch KeyboardEvent('keydown', { key: 'Enter' }) on textarea;
   * onSubmit NOT called.
   */
  describe('T-005: Plain Enter does NOT submit', () => {
    it('does not call onSubmit when plain Enter is pressed', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit, draftComment: 'some text' });
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(event);

      expect(onSubmit).not.toHaveBeenCalled();

      modal.destroy();
    });
  });

  /**
   * T-006: Cmd+Enter submits when textarea has content.
   * Dispatch KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
   * on textarea with content; onSubmit called with trimmed text.
   */
  describe('T-006: Cmd+Enter submits', () => {
    it('calls onSubmit with trimmed text when Cmd+Enter is pressed', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit });
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      textarea.value = '  Hello World  ';

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(event);

      expect(onSubmit).toHaveBeenCalledWith('Hello World', 'suggestion', undefined);

      modal.destroy();
    });

    it('does not submit when textarea is empty', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit });
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      textarea.value = '   ';

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(event);

      expect(onSubmit).not.toHaveBeenCalled();

      modal.destroy();
    });
  });

  /**
   * T-007: Ctrl+Enter submits when textarea has content.
   * Dispatch KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true })
   * on textarea with content; onSubmit called.
   */
  describe('T-007: Ctrl+Enter submits', () => {
    it('calls onSubmit when Ctrl+Enter is pressed with content', () => {
      const onSubmit = jest.fn();
      const modal = createModal({ onSubmit });
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      textarea.value = 'Feedback text';

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      textarea.dispatchEvent(event);

      expect(onSubmit).toHaveBeenCalledWith('Feedback text', 'suggestion', undefined);

      modal.destroy();
    });
  });

  /**
   * T-008: Submit hint shows OS-appropriate modifier.
   * When navigator.platform includes "Mac", hint text contains "Cmd+Enter";
   * otherwise "Ctrl+Enter".
   */
  describe('T-008: Submit hint shows OS-appropriate modifier', () => {
    it('shows "Cmd+Enter to submit" on Mac', () => {
      mockPlatform('MacIntel');
      const modal = createModal();
      const hint = container.querySelector('.fb-submit-hint');
      expect(hint).not.toBeNull();
      expect(hint!.textContent).toContain('Cmd+Enter');

      modal.destroy();
    });

    it('shows "Ctrl+Enter to submit" on non-Mac', () => {
      mockPlatform('Win32');
      const modal = createModal();
      const hint = container.querySelector('.fb-submit-hint');
      expect(hint).not.toBeNull();
      expect(hint!.textContent).toContain('Ctrl+Enter');

      modal.destroy();
    });
  });

  /**
   * T-010: Draft saved indicator appears after auto-save.
   * Type in textarea, wait 2000ms+ for draft timer;
   * indicator element with text "Draft saved" becomes visible.
   */
  describe('T-010: Draft saved indicator', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('shows "Draft saved" indicator after draft timer fires', () => {
      const onDraftSave = jest.fn();
      const modal = createModal({ onDraftSave });
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;

      // Type something
      textarea.value = 'Draft content';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Advance past the 2000ms draft debounce timer
      jest.advanceTimersByTime(2100);

      expect(onDraftSave).toHaveBeenCalledWith('Draft content', 'suggestion', undefined);

      const indicator = container.querySelector('.fb-draft-saved') as HTMLElement;
      expect(indicator).not.toBeNull();
      expect(indicator.textContent).toBe('Draft saved');
      expect(indicator.style.display).toBe('inline');

      modal.destroy();
    });

    it('indicator fades out after ~1.5s', () => {
      const onDraftSave = jest.fn();
      const modal = createModal({ onDraftSave });
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;

      textarea.value = 'Draft content';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Draft timer fires
      jest.advanceTimersByTime(2100);

      const indicator = container.querySelector('.fb-draft-saved') as HTMLElement;
      expect(indicator.style.opacity).toBe('1');

      // After 1.5s the opacity goes to 0
      jest.advanceTimersByTime(1600);
      expect(indicator.style.opacity).toBe('0');

      // After another 300ms, display goes to none
      jest.advanceTimersByTime(400);
      expect(indicator.style.display).toBe('none');

      modal.destroy();
    });
  });

  /**
   * T-013: Textarea has aria-label.
   * textarea.getAttribute('aria-label') equals "Feedback description".
   */
  describe('T-013: Textarea has aria-label', () => {
    it('has aria-label="Feedback description"', () => {
      const modal = createModal();
      const textarea = container.querySelector('.fb-textarea') as HTMLTextAreaElement;
      expect(textarea.getAttribute('aria-label')).toBe('Feedback description');

      modal.destroy();
    });
  });

  /**
   * T-015: Modal has dialog role and aria-modal.
   * Modal element has role="dialog", aria-modal="true",
   * and aria-label containing component name.
   */
  describe('T-015: Modal has dialog role and aria-modal', () => {
    it('has role="dialog"', () => {
      const modal = createModal();
      const dialogEl = container.querySelector('.fb-modal');
      expect(dialogEl).not.toBeNull();
      expect(dialogEl!.getAttribute('role')).toBe('dialog');

      modal.destroy();
    });

    it('has aria-modal="true"', () => {
      const modal = createModal();
      const dialogEl = container.querySelector('.fb-modal');
      expect(dialogEl!.getAttribute('aria-modal')).toBe('true');

      modal.destroy();
    });

    it('has aria-label containing the component name', () => {
      const modal = createModal({
        componentInfo: createComponentInfo({ name: 'MyWidget' }),
      });
      const dialogEl = container.querySelector('.fb-modal');
      expect(dialogEl!.getAttribute('aria-label')).toContain('MyWidget');

      modal.destroy();
    });
  });
});
