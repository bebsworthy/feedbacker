import { renderHook, act } from '@testing-library/react';
import { useFeedbackEvent, useFeedbackEventHelpers } from '../useFeedbackEvent';

// Mock logger to suppress output during tests
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
}));

describe('useFeedbackEvent', () => {
  it('should return emit, on, and once functions', () => {
    // Protects against: missing or renamed API surface
    const { result } = renderHook(() => useFeedbackEvent());

    expect(typeof result.current.emit).toBe('function');
    expect(typeof result.current.on).toBe('function');
    expect(typeof result.current.once).toBe('function');
  });

  it('should deliver payload to registered listener via on()', () => {
    // Protects against: broken pub/sub delivery
    const { result } = renderHook(() => useFeedbackEvent());
    const listener = jest.fn();

    act(() => {
      result.current.on('modal:open', listener);
    });

    act(() => {
      result.current.emit('modal:open', { id: 'test-component' });
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ id: 'test-component' });
  });

  it('should invoke once() listener only on the first emit', () => {
    // Protects against: once listener firing multiple times
    const { result } = renderHook(() => useFeedbackEvent());
    const listener = jest.fn();

    act(() => {
      result.current.once('modal:close', listener);
    });

    act(() => {
      result.current.emit('modal:close', 'first');
      result.current.emit('modal:close', 'second');
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('first');
  });

  it('should unsubscribe when cleanup function from on() is called', () => {
    // Protects against: memory leaks / stale listeners after manual unsubscribe
    const { result } = renderHook(() => useFeedbackEvent());
    const listener = jest.fn();
    let cleanup: () => void;

    act(() => {
      cleanup = result.current.on('sidebar:open', listener);
    });

    act(() => {
      cleanup();
    });

    act(() => {
      result.current.emit('sidebar:open');
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should clean up all listeners when the hook unmounts', () => {
    // Protects against: memory leaks on component unmount
    const listener = jest.fn();
    const { result, unmount } = renderHook(() => useFeedbackEvent());

    act(() => {
      result.current.on('draft:save', listener);
    });

    // Get a separate emitter to emit after unmount
    const { result: emitter } = renderHook(() => useFeedbackEvent());

    unmount();

    act(() => {
      emitter.current.emit('draft:save', 'after-unmount');
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it('should not throw when a listener errors during emit', () => {
    // Protects against: one bad listener breaking all event delivery
    const { result } = renderHook(() => useFeedbackEvent());
    const badListener = jest.fn(() => {
      throw new Error('boom');
    });
    const goodListener = jest.fn();

    act(() => {
      result.current.on('feedback:submit', badListener);
      result.current.on('feedback:submit', goodListener);
    });

    expect(() => {
      act(() => {
        result.current.emit('feedback:submit', 'data');
      });
    }).not.toThrow();

    expect(goodListener).toHaveBeenCalledWith('data');
  });

  it('should emit helper events with correct event type', () => {
    // Protects against: helper functions using wrong event types
    const { result: hookResult } = renderHook(() => useFeedbackEvent());
    const { result: helpersResult } = renderHook(() => useFeedbackEventHelpers());
    const listener = jest.fn();

    act(() => {
      hookResult.current.on('modal:close', listener);
    });

    act(() => {
      helpersResult.current.closeModal();
    });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
