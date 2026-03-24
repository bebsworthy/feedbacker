import { Logger, LogLevel } from '../logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    jest.restoreAllMocks();
  });

  describe('default config in test environment', () => {
    it('should default to WARN level in test env', () => {
      const config = logger.getConfig();
      expect(config.level).toBe(LogLevel.WARN);
    });

    it('should be enabled in test env', () => {
      const config = logger.getConfig();
      expect(config.enabled).toBe(true);
    });

    it('should have [Detection] prefix', () => {
      const config = logger.getConfig();
      expect(config.prefix).toBe('[Detection]');
    });
  });

  describe('shouldLog filtering', () => {
    it('should suppress debug messages in test env (WARN level)', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      logger.debug('test message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should suppress info messages in test env (WARN level)', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('test message');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should allow warn messages in test env', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      logger.warn('test warning');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[Detection]'),
        // no extra args
      );
    });

    it('should allow error messages in test env', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      logger.error('test error');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[Detection]'),
      );
    });
  });

  describe('log() alias', () => {
    it('should delegate to info()', () => {
      logger.setLevel(LogLevel.DEBUG);
      const spy = jest.spyOn(console, 'log').mockImplementation();
      logger.log('alias test');
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
      );
    });
  });

  describe('configure()', () => {
    it('should merge partial config', () => {
      logger.configure({ timestamp: true });
      const config = logger.getConfig();
      expect(config.timestamp).toBe(true);
      // other fields unchanged
      expect(config.prefix).toBe('[Detection]');
      expect(config.enabled).toBe(true);
    });

    it('should allow changing level via configure', () => {
      logger.configure({ level: LogLevel.DEBUG });
      const config = logger.getConfig();
      expect(config.level).toBe(LogLevel.DEBUG);
    });
  });

  describe('enable() / disable()', () => {
    it('should disable logging', () => {
      logger.disable();
      const spy = jest.spyOn(console, 'error').mockImplementation();
      logger.error('should not appear');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should re-enable logging', () => {
      logger.disable();
      logger.enable();
      const spy = jest.spyOn(console, 'error').mockImplementation();
      logger.error('should appear');
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('setLevel()', () => {
    it('should change the log level threshold', () => {
      logger.setLevel(LogLevel.DEBUG);
      const spy = jest.spyOn(console, 'log').mockImplementation();
      logger.debug('now visible');
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConfig()', () => {
    it('should return a copy that does not mutate internal state', () => {
      const config = logger.getConfig();
      (config as any).level = LogLevel.NONE;
      expect(logger.getConfig().level).toBe(LogLevel.WARN);
    });
  });
});
