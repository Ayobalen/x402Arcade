/**
 * Structured Logging Utility
 *
 * Provides structured JSON logging for production environments with:
 * - Request ID tracing
 * - Log levels (debug, info, warn, error)
 * - Contextual metadata
 * - Railway log streaming compatibility
 * - Integration with monitoring services (Datadog, New Relic, etc.)
 *
 * In development: Pretty-printed colored logs
 * In production: JSON logs for log aggregation
 *
 * @module utils/logger
 */

import { getEnv } from '../config/env.js';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log level priorities for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Structured log entry
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  pretty: boolean;
  includeStack: boolean;
}

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

/**
 * Logger class for structured logging
 */
class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    const env = getEnv();

    this.config = {
      level: this.parseLogLevel(process.env.LOG_LEVEL || 'info'),
      pretty: env.NODE_ENV !== 'production',
      includeStack: env.NODE_ENV !== 'production',
      ...config,
    };
  }

  /**
   * Parse log level from string
   */
  private parseLogLevel(level: string): LogLevel {
    const normalizedLevel = level.toLowerCase();
    if (Object.values(LogLevel).includes(normalizedLevel as LogLevel)) {
      return normalizedLevel as LogLevel;
    }
    return LogLevel.INFO;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  /**
   * Format log entry for output
   */
  private format(entry: LogEntry): string {
    if (this.config.pretty) {
      return this.formatPretty(entry);
    }
    return JSON.stringify(entry);
  }

  /**
   * Format log entry for pretty terminal output
   */
  private formatPretty(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: COLORS.gray,
      [LogLevel.INFO]: COLORS.cyan,
      [LogLevel.WARN]: COLORS.yellow,
      [LogLevel.ERROR]: COLORS.red,
    };

    const color = levelColors[entry.level] || COLORS.white;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(5);
    const requestId = entry.requestId ? `[${entry.requestId.substring(0, 8)}]` : '';

    let output = `${COLORS.gray}${timestamp}${COLORS.reset} ${color}${level}${COLORS.reset} ${requestId} ${entry.message}`;

    // Add context
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  ${COLORS.dim}${JSON.stringify(entry.context, null, 2)}${COLORS.reset}`;
    }

    // Add error details
    if (entry.error) {
      output += `\n  ${COLORS.red}Error: ${entry.error.message}${COLORS.reset}`;
      if (this.config.includeStack && entry.error.stack) {
        output += `\n${COLORS.gray}${entry.error.stack}${COLORS.reset}`;
      }
    }

    // Add duration
    if (entry.duration !== undefined) {
      const durationColor = entry.duration > 1000 ? COLORS.yellow : COLORS.green;
      output += ` ${durationColor}(${entry.duration}ms)${COLORS.reset}`;
    }

    return output;
  }

  /**
   * Write log entry to output
   */
  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const output = this.format(entry);

    // Use console.error for ERROR level, console.log for others
    if (entry.level === LogLevel.ERROR) {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  /**
   * Create a log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.write(this.createEntry(LogLevel.DEBUG, message, context));
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.write(this.createEntry(LogLevel.INFO, message, context));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.write(this.createEntry(LogLevel.WARN, message, context));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.ERROR, message, context);

    if (error) {
      entry.error = {
        message: error.message,
        stack: this.config.includeStack ? error.stack : undefined,
        code: (error as Error & { code?: string }).code,
      };
    }

    this.write(entry);
  }

  /**
   * Log HTTP request
   */
  http(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    requestId?: string,
    context?: Record<string, unknown>
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.write({
      ...this.createEntry(level, `${method} ${path} ${statusCode}`, context),
      method,
      path,
      statusCode,
      duration,
      requestId,
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, context);
  }
}

/**
 * Child logger with persistent context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: Record<string, unknown>
  ) {}

  debug(message: string, additionalContext?: Record<string, unknown>): void {
    this.parent.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: Record<string, unknown>): void {
    this.parent.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: Record<string, unknown>): void {
    this.parent.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, error?: Error, additionalContext?: Record<string, unknown>): void {
    this.parent.error(message, error, { ...this.context, ...additionalContext });
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create a logger instance with custom configuration
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

/**
 * Default export for convenience
 */
export default logger;
