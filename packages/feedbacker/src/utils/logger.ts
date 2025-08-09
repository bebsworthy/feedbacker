/**
 * Custom logger utility for Feedbacker
 * Provides environment-aware logging that can be disabled in production
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  enabled: boolean;
  timestamp: boolean;
}

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;
  private isTest: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isTest = process.env.NODE_ENV === 'test';

    // Default configuration
    this.config = {
      level: this.getDefaultLogLevel(),
      prefix: '[Feedbacker]',
      enabled: this.isDevelopment || this.isTest,
      timestamp: false
    };

    // Allow runtime configuration via window object in browser
    if (typeof window !== 'undefined' && (window as any).__FEEDBACKER_LOG_LEVEL__) {
      this.config.level = (window as any).__FEEDBACKER_LOG_LEVEL__;
    }
  }

  private getDefaultLogLevel(): LogLevel {
    if (process.env.NODE_ENV === 'production') {
      return LogLevel.ERROR; // Only errors in production
    }
    if (process.env.NODE_ENV === 'test') {
      return LogLevel.WARN; // Warnings and errors in tests
    }
    return LogLevel.DEBUG; // Everything in development
  }

  private shouldLog(level: LogLevel): boolean {
    return this.config.enabled && level >= this.config.level;
  }

  private formatMessage(level: string, message: string, ...args: unknown[]): unknown[] {
    const timestamp = this.config.timestamp ? `[${new Date().toISOString()}] ` : '';
    const levelStr = `[${level}]`;
    return [`${timestamp}${this.config.prefix} ${levelStr} ${message}`, ...args];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.log(...this.formatMessage('DEBUG', message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      // eslint-disable-next-line no-console
      console.log(...this.formatMessage('INFO', message, ...args));
    }
  }

  log(message: string, ...args: unknown[]): void {
    this.info(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      // eslint-disable-next-line no-console
      console.warn(...this.formatMessage('WARN', message, ...args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      // eslint-disable-next-line no-console
      console.error(...this.formatMessage('ERROR', message, ...args));
    }
  }

  /**
   * Group related logs together (only in development)
   */
  group(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.group(`${this.config.prefix} ${label}`);
    }
  }

  groupEnd(): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  /**
   * Create a table output (only in development)
   */
  table(data: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.table(data);
    }
  }

  /**
   * Time measurement utilities
   */
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.time(`${this.config.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      // eslint-disable-next-line no-console
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }

  /**
   * Configure the logger at runtime
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enable or disable logging
   */
  enable(): void {
    this.config.enabled = true;
  }

  disable(): void {
    this.config.enabled = false;
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the instance and the class for testing
export { logger, Logger };

// Default export for convenience
export default logger;
