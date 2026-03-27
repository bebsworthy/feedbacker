/**
 * Tests for FAB pill toolbar component.
 */

import { FAB } from '../ui/fab';

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

describe('FAB Pill', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    restorePlatform();
  });

  function createFAB(overrides: Partial<{
    feedbackCount: number;
    hasDraft: boolean;
    position: string;
    primaryColor: string;
    onNewFeedback: jest.Mock;
    onShowManager: jest.Mock;
  }> = {}) {
    return new FAB(container, {
      feedbackCount: overrides.feedbackCount ?? 3,
      hasDraft: overrides.hasDraft ?? false,
      position: overrides.position,
      primaryColor: overrides.primaryColor,
      onNewFeedback: overrides.onNewFeedback ?? jest.fn(),
      onShowManager: overrides.onShowManager ?? jest.fn(),
    });
  }

  describe('rendering', () => {
    it('renders a pill with capture button and count', () => {
      const fab = createFAB({ feedbackCount: 5 });
      const pill = container.querySelector('.fb-fab-pill');
      expect(pill).not.toBeNull();

      const capture = container.querySelector('.fb-fab-capture');
      expect(capture).not.toBeNull();
      expect(capture!.textContent).toContain('Capture');

      const count = container.querySelector('.fb-fab-count');
      expect(count).not.toBeNull();
      expect(count!.textContent).toBe('5');

      fab.destroy();
    });

    it('hides count button when feedbackCount is 0', () => {
      const fab = createFAB({ feedbackCount: 0 });
      const count = container.querySelector('.fb-fab-count') as HTMLElement;
      expect(count.style.display).toBe('none');

      fab.destroy();
    });

    it('shows count button when feedbackCount > 0', () => {
      const fab = createFAB({ feedbackCount: 2 });
      const count = container.querySelector('.fb-fab-count') as HTMLElement;
      expect(count.style.display).toBe('flex');

      fab.destroy();
    });
  });

  describe('click actions', () => {
    it('clicking capture button calls onNewFeedback', () => {
      const onNewFeedback = jest.fn();
      const fab = createFAB({ onNewFeedback });
      const capture = container.querySelector('.fb-fab-capture') as HTMLButtonElement;
      capture.click();

      expect(onNewFeedback).toHaveBeenCalledTimes(1);

      fab.destroy();
    });

    it('clicking count button calls onShowManager', () => {
      const onShowManager = jest.fn();
      const fab = createFAB({ feedbackCount: 3, onShowManager });
      const count = container.querySelector('.fb-fab-count') as HTMLButtonElement;
      count.click();

      expect(onShowManager).toHaveBeenCalledTimes(1);

      fab.destroy();
    });

    it('clicking count does NOT trigger capture', () => {
      const onNewFeedback = jest.fn();
      const fab = createFAB({ feedbackCount: 3, onNewFeedback });
      const count = container.querySelector('.fb-fab-count') as HTMLButtonElement;
      count.click();

      expect(onNewFeedback).not.toHaveBeenCalled();

      fab.destroy();
    });
  });

  describe('keyboard shortcut tooltip', () => {
    it('shows Opt+Shift+F on Mac', () => {
      mockPlatform('MacIntel');
      const fab = createFAB();
      const capture = container.querySelector('.fb-fab-capture') as HTMLButtonElement;
      expect(capture.title).toContain('Opt+Shift+F');

      fab.destroy();
    });

    it('shows Alt+Shift+F on non-Mac', () => {
      mockPlatform('Win32');
      const fab = createFAB();
      const capture = container.querySelector('.fb-fab-capture') as HTMLButtonElement;
      expect(capture.title).toContain('Alt+Shift+F');

      fab.destroy();
    });
  });

  describe('accessibility', () => {
    it('capture button has aria-label', () => {
      const fab = createFAB();
      const capture = container.querySelector('.fb-fab-capture') as HTMLButtonElement;
      expect(capture.getAttribute('aria-label')).toBe('Start feedback capture');

      fab.destroy();
    });

    it('count button has descriptive aria-label', () => {
      const fab = createFAB({ feedbackCount: 7 });
      const count = container.querySelector('.fb-fab-count') as HTMLElement;
      expect(count.getAttribute('aria-label')).toContain('7');
      expect(count.getAttribute('aria-label')).toContain('feedback items');

      fab.destroy();
    });

    it('updates count aria-label when count changes', () => {
      const fab = createFAB({ feedbackCount: 3 });
      fab.updateCount(10);
      const count = container.querySelector('.fb-fab-count') as HTMLElement;
      expect(count.getAttribute('aria-label')).toContain('10');

      fab.destroy();
    });
  });

  describe('updateCount', () => {
    it('updates displayed count text', () => {
      const fab = createFAB({ feedbackCount: 1 });
      fab.updateCount(42);
      const count = container.querySelector('.fb-fab-count') as HTMLElement;
      expect(count.textContent).toBe('42');

      fab.destroy();
    });

    it('shows 99+ for counts over 99', () => {
      const fab = createFAB({ feedbackCount: 1 });
      fab.updateCount(150);
      const count = container.querySelector('.fb-fab-count') as HTMLElement;
      expect(count.textContent).toBe('99+');

      fab.destroy();
    });

    it('hides count when set to 0', () => {
      const fab = createFAB({ feedbackCount: 5 });
      fab.updateCount(0);
      const count = container.querySelector('.fb-fab-count') as HTMLElement;
      expect(count.style.display).toBe('none');

      fab.destroy();
    });
  });

  describe('positioning', () => {
    it('defaults to bottom-right', () => {
      const fab = createFAB();
      const pill = container.querySelector('.fb-fab-pill') as HTMLElement;
      expect(pill.style.bottom).toBe('24px');
      expect(pill.style.right).toBe('24px');

      fab.destroy();
    });

    it('positions top-left correctly', () => {
      const fab = createFAB({ position: 'top-left' });
      const pill = container.querySelector('.fb-fab-pill') as HTMLElement;
      expect(pill.style.top).toBe('24px');
      expect(pill.style.left).toBe('24px');

      fab.destroy();
    });

    it('positions bottom-left correctly', () => {
      const fab = createFAB({ position: 'bottom-left' });
      const pill = container.querySelector('.fb-fab-pill') as HTMLElement;
      expect(pill.style.bottom).toBe('24px');
      expect(pill.style.left).toBe('24px');

      fab.destroy();
    });

    it('positions top-right correctly', () => {
      const fab = createFAB({ position: 'top-right' });
      const pill = container.querySelector('.fb-fab-pill') as HTMLElement;
      expect(pill.style.top).toBe('24px');
      expect(pill.style.right).toBe('24px');

      fab.destroy();
    });
  });

  describe('collapse/expand', () => {
    it('collapse hides the pill', () => {
      const fab = createFAB();
      fab.collapse();
      const pill = container.querySelector('.fb-fab-pill') as HTMLElement;
      expect(pill.style.display).toBe('none');

      fab.destroy();
    });

    it('expand shows the pill after collapse', () => {
      const fab = createFAB();
      fab.collapse();
      fab.expand();
      const pill = container.querySelector('.fb-fab-pill') as HTMLElement;
      expect(pill.style.display).toBe('flex');

      fab.destroy();
    });
  });

  describe('destroy', () => {
    it('removes the pill from DOM', () => {
      const fab = createFAB();
      expect(container.querySelector('.fb-fab-pill')).not.toBeNull();
      fab.destroy();
      expect(container.querySelector('.fb-fab-pill')).toBeNull();
    });
  });

  describe('custom color', () => {
    it('applies primary color to capture button', () => {
      const fab = createFAB({ primaryColor: '#ff0000' });
      const capture = container.querySelector('.fb-fab-capture') as HTMLElement;
      expect(capture.style.background).toBe('rgb(255, 0, 0)');

      fab.destroy();
    });
  });
});
