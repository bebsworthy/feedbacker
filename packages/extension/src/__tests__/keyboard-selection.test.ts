/**
 * Tests for DetectionController keyboard selection.
 * Covers T-050 through T-058 (PH-016).
 *
 * T-069 is an e2e test and is not covered here.
 */

// Mock chrome.runtime before imports
Object.assign(global, {
  chrome: {
    runtime: { sendMessage: jest.fn() },
    storage: { local: { get: jest.fn(), set: jest.fn() } },
  },
});

jest.mock('@feedbacker/core', () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@feedbacker/detection', () => {
  const detectComponent = jest.fn((el: HTMLElement) => ({
    name: el.tagName.toLowerCase(),
    path: [el.tagName.toLowerCase()],
    element: el,
  }));
  return {
    createDetector: () => ({ detectComponent }),
    throttle: (fn: (...args: unknown[]) => void) => fn,
    getHumanReadableName: jest.fn((el: HTMLElement) => el.tagName.toLowerCase()),
  };
});

import { DetectionController } from '../core/detection-controller';

describe('DetectionController — keyboard selection', () => {
  let controller: DetectionController;
  let onHover: jest.Mock;
  let onSelect: jest.Mock;

  beforeEach(() => {
    controller = new DetectionController();
    onHover = jest.fn();
    onSelect = jest.fn();
    controller.setCallbacks(onHover, onSelect);
    controller.activate();
  });

  afterEach(() => {
    controller.destroy();
    // Clean up any elements we added to the DOM
    document.body.innerHTML = '';
  });

  function dispatchKeydown(key: string, opts: Partial<KeyboardEventInit> = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...opts,
    });
    document.dispatchEvent(event);
    return event;
  }

  /**
   * T-050: Tab key moves focus to next focusable element and calls onHover
   */
  it('T-050: Tab moves to next focusable element and calls onHover', () => {
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Second';
    document.body.appendChild(btn1);
    document.body.appendChild(btn2);

    onHover.mockClear();

    dispatchKeydown('Tab');

    expect(controller.currentElement).toBe(btn1);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ element: btn1 })
    );

    onHover.mockClear();
    dispatchKeydown('Tab');

    expect(controller.currentElement).toBe(btn2);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ element: btn2 })
    );
  });

  /**
   * T-051: Shift+Tab moves to previous focusable element
   */
  it('T-051: Shift+Tab moves to previous focusable element', () => {
    const btn1 = document.createElement('button');
    const btn2 = document.createElement('button');
    const btn3 = document.createElement('button');
    document.body.appendChild(btn1);
    document.body.appendChild(btn2);
    document.body.appendChild(btn3);

    // Tab forward twice to btn2
    dispatchKeydown('Tab');
    dispatchKeydown('Tab');
    expect(controller.currentElement).toBe(btn2);

    onHover.mockClear();
    dispatchKeydown('Tab', { shiftKey: true });

    expect(controller.currentElement).toBe(btn1);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ element: btn1 })
    );
  });

  /**
   * T-052: Escape deactivates selection mode without opening modal
   */
  it('T-052: Escape deactivates selection mode; no modal opened', () => {
    dispatchKeydown('Escape');

    expect(controller.isActive).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  /**
   * T-053: No focusable elements — ARIA live region announces message
   */
  it('T-053: Tab with no focusable elements announces via ARIA live region', () => {
    // body.innerHTML is empty — no focusable elements (except the ARIA region itself
    // which has no tabindex/href/etc)
    dispatchKeydown('Tab');

    const liveRegion = document.getElementById('feedbacker-aria-live');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion!.textContent).toBe(
      'No focusable elements found. Use arrow keys to navigate.'
    );
  });

  /**
   * T-054: Arrow Up moves highlight to parent element
   */
  it('T-054: Arrow Up moves to parent element', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    controller.setCurrentElement(child);
    onHover.mockClear();

    dispatchKeydown('ArrowUp');

    expect(controller.currentElement).toBe(parent);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ element: parent })
    );
  });

  /**
   * T-055: Arrow Down moves to first child element
   */
  it('T-055: Arrow Down moves to first child element', () => {
    const parent = document.createElement('div');
    const child1 = document.createElement('span');
    const child2 = document.createElement('p');
    parent.appendChild(child1);
    parent.appendChild(child2);
    document.body.appendChild(parent);

    controller.setCurrentElement(parent);
    onHover.mockClear();

    dispatchKeydown('ArrowDown');

    expect(controller.currentElement).toBe(child1);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ element: child1 })
    );
  });

  /**
   * T-056: Arrow Up on <html> element is ignored; highlight unchanged
   */
  it('T-056: Arrow Up on <html> is ignored', () => {
    controller.setCurrentElement(document.documentElement);
    onHover.mockClear();

    dispatchKeydown('ArrowUp');

    expect(controller.currentElement).toBe(document.documentElement);
    // navigateToParent returns null for <html> — no onHover call
    expect(onHover).not.toHaveBeenCalled();
  });

  /**
   * T-057: Enter confirms selection — deactivates and calls onSelect
   */
  it('T-057: Enter confirms selection and calls onSelect', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Click me';
    document.body.appendChild(btn);

    controller.setCurrentElement(btn);
    onSelect.mockClear();

    dispatchKeydown('Enter');

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ element: btn })
    );
    expect(controller.isActive).toBe(false);
  });

  /**
   * T-058: Enter calls preventDefault and stopPropagation
   */
  it('T-058: Enter calls preventDefault and stopPropagation', () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    controller.setCurrentElement(btn);

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = jest.spyOn(event, 'preventDefault');
    const stopSpy = jest.spyOn(event, 'stopPropagation');

    document.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });
});

describe('DetectionController — keyboard selection edge cases', () => {
  let controller: DetectionController;

  beforeEach(() => {
    controller = new DetectionController();
    controller.setCallbacks(jest.fn(), jest.fn());
    controller.activate();
  });

  afterEach(() => {
    controller.destroy();
    document.body.innerHTML = '';
  });

  it('Tab wraps around to first element after reaching last', () => {
    const btn1 = document.createElement('button');
    const btn2 = document.createElement('button');
    document.body.appendChild(btn1);
    document.body.appendChild(btn2);

    // Tab three times: btn1, btn2, wrap to btn1
    const event1 = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event1);
    const event2 = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event2);
    const event3 = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event3);

    expect(controller.currentElement).toBe(btn1);
  });

  it('Shift+Tab wraps to last element from first', () => {
    const btn1 = document.createElement('button');
    const btn2 = document.createElement('button');
    document.body.appendChild(btn1);
    document.body.appendChild(btn2);

    // Shift+Tab from initial position (-1) should go to last element
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(controller.currentElement).toBe(btn2);
  });

  it('ARIA live region is removed on deactivation', () => {
    expect(document.getElementById('feedbacker-aria-live')).not.toBeNull();

    controller.deactivate();

    expect(document.getElementById('feedbacker-aria-live')).toBeNull();
  });

  it('keydown listener is removed on deactivation', () => {
    controller.deactivate();

    const btn = document.createElement('button');
    document.body.appendChild(btn);

    // Re-check that Tab does nothing after deactivation
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    // currentElement was cleared on deactivate
    expect(controller.currentElement).toBeNull();
  });

  it('disabled buttons are excluded from focusable elements', () => {
    const btn = document.createElement('button');
    btn.disabled = true;
    document.body.appendChild(btn);

    const link = document.createElement('a');
    link.href = 'https://example.com';
    document.body.appendChild(link);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(controller.currentElement).toBe(link);
  });

  it('elements with tabindex="-1" are excluded from focusable elements', () => {
    const div = document.createElement('div');
    div.tabIndex = -1;
    document.body.appendChild(div);

    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(controller.currentElement).toBe(input);
  });

  it('Enter without a current element does nothing', () => {
    const onSelect = jest.fn();
    controller.setCallbacks(jest.fn(), onSelect);

    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(onSelect).not.toHaveBeenCalled();
    expect(controller.isActive).toBe(true);
  });

  it('ArrowDown without current element does nothing', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(controller.currentElement).toBeNull();
  });

  it('extension elements are excluded from focusable elements', () => {
    const extBtn = document.createElement('button');
    extBtn.id = 'feedbacker-extension-root';
    document.body.appendChild(extBtn);

    const normalBtn = document.createElement('button');
    document.body.appendChild(normalBtn);

    const focusable = controller.getFocusableElements();
    expect(focusable).not.toContain(extBtn);
    expect(focusable).toContain(normalBtn);
  });
});
