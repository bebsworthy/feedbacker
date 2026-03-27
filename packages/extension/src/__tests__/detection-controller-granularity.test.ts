/**
 * Tests for DetectionController DOM hierarchy navigation and scroll-wheel granularity.
 * Covers T-018 through T-023 (PH-010).
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

describe('DetectionController — DOM hierarchy navigation', () => {
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
  });

  /**
   * T-018: navigateToParent on a nested element returns parent
   * and calls onHover with parent's ComponentInfo
   */
  it('T-018: navigateToParent returns parent and calls onHover', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    controller.setCurrentElement(child);
    onHover.mockClear();

    const result = controller.navigateToParent();

    expect(result).toBe(parent);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ element: parent })
    );
    expect(controller.currentElement).toBe(parent);

    parent.remove();
  });

  /**
   * T-019: navigateToParent on <html> returns null
   */
  it('T-019: navigateToParent on <html> returns null', () => {
    const html = document.documentElement;
    controller.setCurrentElement(html);
    onHover.mockClear();

    const result = controller.navigateToParent();

    expect(result).toBeNull();
    // onHover should not be called again since we didn't navigate
    expect(onHover).not.toHaveBeenCalled();
  });

  /**
   * T-020: navigateToParent skips extension-injected elements
   */
  it('T-020: navigateToParent skips extension elements', () => {
    const grandparent = document.createElement('div');
    const extensionEl = document.createElement('div');
    extensionEl.id = 'feedbacker-extension-root';
    const child = document.createElement('span');

    grandparent.appendChild(extensionEl);
    extensionEl.appendChild(child);
    document.body.appendChild(grandparent);

    controller.setCurrentElement(child);
    onHover.mockClear();

    const result = controller.navigateToParent();

    // Should skip the extension element and land on a non-extension ancestor
    expect(result).not.toBeNull();
    expect(result?.id).not.toBe('feedbacker-extension-root');

    grandparent.remove();
  });

  /**
   * T-021: navigateToChild returns first child and calls onHover
   */
  it('T-021: navigateToChild returns first child element', () => {
    const parent = document.createElement('div');
    const child1 = document.createElement('span');
    const child2 = document.createElement('p');
    parent.appendChild(child1);
    parent.appendChild(child2);
    document.body.appendChild(parent);

    controller.setCurrentElement(parent);
    onHover.mockClear();

    const result = controller.navigateToChild();

    expect(result).toBe(child1);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ element: child1 })
    );

    parent.remove();
  });

  /**
   * T-022: navigateToChild on element with no children returns null
   */
  it('T-022: navigateToChild returns null for childless element', () => {
    const leaf = document.createElement('span');
    document.body.appendChild(leaf);

    controller.setCurrentElement(leaf);
    onHover.mockClear();

    const result = controller.navigateToChild();

    expect(result).toBeNull();
    expect(onHover).not.toHaveBeenCalled();

    leaf.remove();
  });

  /**
   * T-023: navigateToChild skips script and style elements
   */
  it('T-023: navigateToChild skips script and style children', () => {
    const parent = document.createElement('div');
    const script = document.createElement('script');
    const style = document.createElement('style');
    parent.appendChild(script);
    parent.appendChild(style);
    document.body.appendChild(parent);

    controller.setCurrentElement(parent);
    onHover.mockClear();

    const result = controller.navigateToChild();

    expect(result).toBeNull();

    parent.remove();
  });

  it('navigateToSibling returns next sibling', () => {
    const parent = document.createElement('div');
    const child1 = document.createElement('span');
    const child2 = document.createElement('p');
    parent.appendChild(child1);
    parent.appendChild(child2);
    document.body.appendChild(parent);

    controller.setCurrentElement(child1);
    onHover.mockClear();

    const result = controller.navigateToSibling('next');

    expect(result).toBe(child2);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ element: child2 })
    );

    parent.remove();
  });

  it('navigateToSibling skips script siblings', () => {
    const parent = document.createElement('div');
    const child1 = document.createElement('span');
    const script = document.createElement('script');
    const child3 = document.createElement('p');
    parent.appendChild(child1);
    parent.appendChild(script);
    parent.appendChild(child3);
    document.body.appendChild(parent);

    controller.setCurrentElement(child1);
    onHover.mockClear();

    const result = controller.navigateToSibling('next');

    expect(result).toBe(child3);

    parent.remove();
  });
});

describe('DetectionController — wheel events', () => {
  let controller: DetectionController;
  let onHover: jest.Mock;

  beforeEach(() => {
    controller = new DetectionController();
    onHover = jest.fn();
    controller.setCallbacks(onHover, jest.fn());
    controller.activate();
  });

  afterEach(() => {
    controller.destroy();
  });

  it('wheel listener is registered with capture and passive:false', () => {
    const spy = jest.spyOn(document, 'addEventListener');

    const ctrl = new DetectionController();
    ctrl.setCallbacks(jest.fn(), jest.fn());
    ctrl.activate();

    const wheelCall = spy.mock.calls.find(
      (call) => call[0] === 'wheel'
    );
    expect(wheelCall).toBeDefined();
    expect(wheelCall![2]).toEqual({ capture: true, passive: false });

    ctrl.destroy();
    spy.mockRestore();
  });

  it('wheel listener is removed on deactivation', () => {
    const spy = jest.spyOn(document, 'removeEventListener');

    controller.deactivate();

    const wheelCall = spy.mock.calls.find(
      (call) => call[0] === 'wheel'
    );
    expect(wheelCall).toBeDefined();

    spy.mockRestore();
  });

  it('scroll up navigates to parent', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    controller.setCurrentElement(child);
    onHover.mockClear();

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(wheelEvent);

    expect(controller.currentElement).toBe(parent);

    parent.remove();
  });

  it('scroll down navigates to child', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    controller.setCurrentElement(parent);
    onHover.mockClear();

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(wheelEvent);

    expect(controller.currentElement).toBe(child);

    parent.remove();
  });

  it('page does not scroll during selection (preventDefault called)', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    controller.setCurrentElement(child);

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = jest.spyOn(wheelEvent, 'preventDefault');
    document.dispatchEvent(wheelEvent);

    expect(preventSpy).toHaveBeenCalled();

    parent.remove();
  });
});
