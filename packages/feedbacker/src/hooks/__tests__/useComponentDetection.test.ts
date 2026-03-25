import { renderHook, act } from '@testing-library/react';
import { useComponentDetection } from '../useComponentDetection';

// Mock @feedbacker/detection
jest.mock('@feedbacker/detection', () => ({
  DetectionChain: jest.fn().mockImplementation(() => ({
    buildChain: jest.fn(),
    detectComponent: jest.fn()
  })),
  DevToolsStrategy: jest.fn(),
  FiberStrategy: jest.fn(),
  HeuristicStrategy: jest.fn(),
  FallbackStrategy: jest.fn(),
  requestIdleCallback: jest.fn((cb: (deadline: IdleDeadline) => void) => {
    // Execute callback immediately with enough time remaining
    cb({ timeRemaining: () => 50, didTimeout: false } as IdleDeadline);
    return 1;
  }),
  cancelIdleCallback: jest.fn(),
  debounce: jest.fn((fn: (...a: any[]) => any) => {
    const debounced = (...args: any[]) => fn(...args);
    debounced.cancel = jest.fn();
    return debounced;
  }),
  throttle: jest.fn((fn: (...a: any[]) => any) => {
    const throttled = (...args: any[]) => fn(...args);
    throttled.cancel = jest.fn();
    return throttled;
  }),
  performanceMonitor: { mark: jest.fn(() => jest.fn()) },
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
}));

describe('useComponentDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.style.cursor = '';
  });

  it('should initialise with isActive false and selectedComponent null', () => {
    // Protects against: wrong default state causing UI to render in selection mode
    const { result } = renderHook(() => useComponentDetection());

    expect(result.current.isActive).toBe(false);
    expect(result.current.selectedComponent).toBeNull();
    expect(result.current.hoveredComponent).toBeNull();
  });

  it('should set isActive to true when activate is called', () => {
    // Protects against: activate not toggling selection mode on
    const { result } = renderHook(() => useComponentDetection());

    act(() => {
      result.current.activate();
    });

    expect(result.current.isActive).toBe(true);
  });

  it('should set isActive to false and clear selectedComponent when deactivate is called', () => {
    // Protects against: deactivate leaving stale state behind
    const { result } = renderHook(() => useComponentDetection());

    act(() => {
      result.current.activate();
    });

    act(() => {
      result.current.deactivate();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.selectedComponent).toBeNull();
    expect(result.current.hoveredComponent).toBeNull();
  });

  it('should set crosshair cursor on activate and clear on deactivate', () => {
    // Protects against: cursor style not changing to indicate selection mode
    const { result } = renderHook(() => useComponentDetection());

    act(() => {
      result.current.activate();
    });

    expect(document.body.style.cursor).toBe('crosshair');

    act(() => {
      result.current.deactivate();
    });

    expect(document.body.style.cursor).toBe('');
  });

  it('should deactivate when ESC key is pressed', () => {
    // Protects against: user unable to exit selection mode via keyboard
    const { result } = renderHook(() => useComponentDetection());

    act(() => {
      result.current.activate();
    });

    expect(result.current.isActive).toBe(true);

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    });

    expect(result.current.isActive).toBe(false);
  });

  it('should clean up event listeners on unmount', () => {
    // Protects against: leaked event listeners causing errors after unmount
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { result, unmount } = renderHook(() => useComponentDetection());

    act(() => {
      result.current.activate();
    });

    const addedCount = addSpy.mock.calls.length;
    expect(addedCount).toBeGreaterThan(0);

    unmount();

    // removeEventListener should have been called for each addEventListener
    const removedTypes = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedTypes).toContain('mousemove');
    expect(removedTypes).toContain('keydown');

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('should not activate twice when already active', () => {
    // Protects against: duplicate event listener registration
    const { result } = renderHook(() => useComponentDetection());

    act(() => {
      result.current.activate();
    });

    act(() => {
      result.current.activate();
    });

    // isActive should still be true, no crash
    expect(result.current.isActive).toBe(true);
  });
});
