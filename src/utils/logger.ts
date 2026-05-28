import winston from 'winston';
import path from 'path';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Configure transports
const transports: winston.transport[] = [];

// Console transport - always add in development, only for errors in production
if (isDevelopment || !isTest) {
  transports.push(
    new winston.transports.Console({
      level: isDevelopment ? 'debug' : 'info',
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    })
  );
}

// File transports - only if not in test mode
if (!isTest) {
  transports.push(
    // Error log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), json()),
    }),
    // Combined log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: combine(timestamp(), json()),
    }),
    // Evolution-specific log
    new winston.transports.File({
      filename: path.join(logsDir, 'evolution.log'),
      format: combine(timestamp(), json()),
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: { service: 'evolution-system' },
  format: combine(
    timestamp({ format: 'ISO8601' }),
    errors({ stack: true }),
    json()
  ),
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Create a child logger for evolution events
export function createEvolutionLogger(evolutionId: string) {
  return logger.child({ evolutionId, component: 'evolution' });
}

// Create a child logger for agent events
export function createAgentLogger(agentId: string, evolutionId?: string) {
  return logger.child({ agentId, evolutionId, component: 'agent' });
}

// Stream for Morgan HTTP logging
export const stream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

// Log evolution events
export function logEvolutionEvent(
  evolutionId: string,
  event: string,
  data?: Record<string, unknown>
): void {
  logger.info(`Evolution event: ${event}`, {
    evolutionId,
    event,
    ...data,
  });
}

// Log agent events
export function logAgentEvent(
  agentId: string,
  event: string,
  data?: Record<string, unknown>
): void {
  logger.info(`Agent event: ${event}`, {
    agentId,
    event,
    ...data,
  });
}

// Performance logging
export function logPerformance(
  operation: string,
  durationMs: number,
  data?: Record<string, unknown>
): void {
  logger.debug(`Performance: ${operation}`, {
    operation,
    durationMs,
    ...data,
  });
}

export default logger;
