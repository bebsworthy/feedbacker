/**
 * Performance utilities for efficient component scanning and operations
 * Implements requestIdleCallback with fallbacks and debouncing utilities
 */

import logger from './logger';

// RequestIdleCallback polyfill for browsers that don't support it
interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining(): number;
}

type IdleCallback = (deadline: IdleDeadline) => void;

interface IdleRequestOptions {
  timeout?: number;
}

/**
 * Request idle callback with fallback for unsupported browsers
 */
export const requestIdleCallback = (
  callback: IdleCallback,
  options?: IdleRequestOptions
): number => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  }

  // Fallback implementation using setTimeout
  const timeout = options?.timeout || 0;
  const startTime = Date.now();

  return setTimeout(() => {
    const deadline: IdleDeadline = {
      didTimeout: timeout > 0 && Date.now() - startTime >= timeout,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - startTime))
    };
    callback(deadline);
  }, 1) as unknown as number;
};

/**
 * Cancel idle callback with fallback
 */
export const cancelIdleCallback = (id: number): void => {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * Debounce function with leading and trailing options
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> | undefined } => {
  let timeoutId: NodeJS.Timeout | undefined;
  let maxTimeoutId: NodeJS.Timeout | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T> | undefined;

  const { leading = false, trailing = true, maxWait } = options;

  const invokeFunc = (time: number) => {
    const args = lastArgs!;
    const thisArg = lastThis;

    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  };

  const leadingEdge = (time: number) => {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time: number) => {
    if (lastCallTime === undefined) {
      return true;
    }

    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time: number) => {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  };

  const cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== undefined) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = maxTimeoutId = undefined;
  };

  const flush = () => {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  };

  const debounced = function (this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return result;
  } as T & { cancel: () => void; flush: () => ReturnType<T> | undefined };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
};

/**
 * Throttle function for limiting execution frequency
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> | undefined } => {
  return debounce(func, wait, {
    leading: true,
    maxWait: wait,
    trailing: true,
    ...options
  });
};

/**
 * Batch operations to run during idle time
 */
export class IdleBatcher {
  private queue: Array<() => void> = [];
  private idleId: number | null = null;
  private isRunning = false;

  add(task: () => void): void {
    this.queue.push(task);
    this.scheduleWork();
  }

  private scheduleWork(): void {
    if (this.isRunning || this.idleId !== null) {
      return;
    }

    this.idleId = requestIdleCallback(
      (deadline) => {
        this.isRunning = true;
        this.idleId = null;

        while (this.queue.length > 0 && deadline.timeRemaining() > 0) {
          const task = this.queue.shift();
          if (task) {
            try {
              task();
            } catch (error) {
              logger.error('Idle task error:', error);
            }
          }
        }

        this.isRunning = false;

        // If there are more tasks, schedule another idle callback
        if (this.queue.length > 0) {
          this.scheduleWork();
        }
      },
      { timeout: 1000 }
    );
  }

  clear(): void {
    this.queue = [];
    if (this.idleId !== null) {
      cancelIdleCallback(this.idleId);
      this.idleId = null;
    }
    this.isRunning = false;
  }

  get queueSize(): number {
    return this.queue.length;
  }
}

/**
 * Performance monitor for tracking expensive operations
 */
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  mark(name: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }

      const times = this.measurements.get(name)!;
      times.push(duration);

      // Keep only the last 100 measurements
      if (times.length > 100) {
        times.shift();
      }
    };
  }

  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.measurements.get(name);
    if (!times || times.length === 0) {
      return null;
    }

    const min = Math.min(...times);
    const max = Math.max(...times);
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const count = times.length;

    return { avg, min, max, count };
  }

  clear(name?: string): void {
    if (name) {
      this.measurements.delete(name);
    } else {
      this.measurements.clear();
    }
  }
}

// Global instances
export const idleBatcher = new IdleBatcher();
export const performanceMonitor = new PerformanceMonitor();
