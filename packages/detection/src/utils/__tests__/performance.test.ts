import {
  debounce,
  throttle,
  requestIdleCallback,
  cancelIdleCallback,
  PerformanceMonitor,
  IdleBatcher,
} from '../performance';

describe('performance utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should fire trailing call after wait period', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 200);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(200);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should fire immediately with leading option', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 200, { leading: true, trailing: false });

      debounced();
      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(200);
      // no trailing call
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending invocation', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 200);

      debounced();
      debounced.cancel();
      jest.advanceTimersByTime(300);

      expect(fn).not.toHaveBeenCalled();
    });

    it('should flush pending invocation immediately', () => {
      const fn = jest.fn().mockReturnValue(42);
      const debounced = debounce(fn, 200);

      debounced();
      const result = debounced.flush();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe(42);
    });

    it('should force invocation after maxWait', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 200, { maxWait: 300 });

      // Keep calling within wait window
      debounced();
      jest.advanceTimersByTime(100);
      debounced();
      jest.advanceTimersByTime(100);
      debounced();
      jest.advanceTimersByTime(100);

      // maxWait (300ms) should have forced invocation by now
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the underlying function', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('a', 'b');
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('a', 'b');
    });
  });

  describe('throttle', () => {
    it('should fire immediately then limit to once per wait', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 200);

      throttled(); // leading fires immediately
      expect(fn).toHaveBeenCalledTimes(1);

      throttled(); // queued
      throttled(); // queued (replaces previous)

      jest.advanceTimersByTime(200);
      // trailing call fires
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('requestIdleCallback polyfill', () => {
    it('should fire callback via setTimeout', () => {
      const cb = jest.fn();
      requestIdleCallback(cb);

      expect(cb).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);

      expect(cb).toHaveBeenCalledTimes(1);
      const deadline = cb.mock.calls[0][0];
      expect(deadline).toHaveProperty('didTimeout');
      expect(typeof deadline.timeRemaining).toBe('function');
    });
  });

  describe('cancelIdleCallback', () => {
    it('should prevent callback from firing', () => {
      const cb = jest.fn();
      const id = requestIdleCallback(cb);

      cancelIdleCallback(id);
      jest.advanceTimersByTime(100);

      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;
    let nowValue: number;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
      nowValue = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => nowValue);
    });

    it('should record a measurement via mark + end', () => {
      nowValue = 100;
      const end = monitor.mark('test-op');
      nowValue = 150;
      end();

      const stats = monitor.getStats('test-op');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(1);
      expect(stats!.avg).toBeCloseTo(50);
    });

    it('should calculate correct stats for multiple measurements', () => {
      // measurement 1: 10ms
      nowValue = 0;
      let end = monitor.mark('op');
      nowValue = 10;
      end();

      // measurement 2: 20ms
      nowValue = 100;
      end = monitor.mark('op');
      nowValue = 120;
      end();

      // measurement 3: 30ms
      nowValue = 200;
      end = monitor.mark('op');
      nowValue = 230;
      end();

      const stats = monitor.getStats('op')!;
      expect(stats.count).toBe(3);
      expect(stats.min).toBeCloseTo(10);
      expect(stats.max).toBeCloseTo(30);
      expect(stats.avg).toBeCloseTo(20);
    });

    it('should return null for unknown measurement name', () => {
      expect(monitor.getStats('nonexistent')).toBeNull();
    });

    it('should clear specific measurement by name', () => {
      nowValue = 0;
      const end = monitor.mark('x');
      nowValue = 5;
      end();

      monitor.clear('x');
      expect(monitor.getStats('x')).toBeNull();
    });

    it('should clear all measurements when no name given', () => {
      nowValue = 0;
      let end = monitor.mark('a');
      nowValue = 1;
      end();

      nowValue = 2;
      end = monitor.mark('b');
      nowValue = 3;
      end();

      monitor.clear();
      expect(monitor.getStats('a')).toBeNull();
      expect(monitor.getStats('b')).toBeNull();
    });

    it('should cap the rolling buffer at 100 measurements', () => {
      for (let i = 0; i < 110; i++) {
        nowValue = i * 10;
        const end = monitor.mark('buf');
        nowValue = i * 10 + 1;
        end();
      }

      const stats = monitor.getStats('buf')!;
      expect(stats.count).toBe(100);
    });
  });

  describe('IdleBatcher', () => {
    it('should queue tasks and reflect queueSize', () => {
      const batcher = new IdleBatcher();
      const task = jest.fn();

      batcher.add(task);
      // task is queued but the idle callback hasn't fired yet
      expect(batcher.queueSize).toBeGreaterThanOrEqual(1);
    });

    it('should clear all queued tasks', () => {
      const batcher = new IdleBatcher();
      batcher.add(jest.fn());
      batcher.add(jest.fn());

      batcher.clear();
      expect(batcher.queueSize).toBe(0);
    });

    it('should execute tasks when idle callback fires', () => {
      const batcher = new IdleBatcher();
      const task = jest.fn();
      batcher.add(task);

      // The polyfill uses setTimeout(..., 1)
      jest.advanceTimersByTime(1);

      expect(task).toHaveBeenCalledTimes(1);
    });
  });
});
