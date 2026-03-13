```typescript
import { createLogger, format, transports } from 'winston';
import config from '../config/config';

const { combine, timestamp, printf, colorize, errors, json } = format;

// Custom log format for console
const developmentFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} ${level}: ${message}`;
  if (stack) {
    log = `${log}\n${stack}`;
  }
  // Add metadata if present (excluding specific fields like stack, level, message, timestamp)
  const metaKeys = Object.keys(metadata);
  if (metaKeys.length > 0) {
    const cleanedMetadata = metaKeys.reduce((acc, key) => {
      // Exclude empty objects or null/undefined values, and sensitive data if any
      if (metadata[key] !== undefined && metadata[key] !== null &&
          !(typeof metadata[key] === 'object' && Object.keys(metadata[key]).length === 0)) {
        acc[key] = metadata[key];
      }
      return acc;
    }, {} as any);

    if (Object.keys(cleanedMetadata).length > 0) {
      log = `${log} ${JSON.stringify(cleanedMetadata)}`;
    }
  }
  return log;
});


const logger = createLogger({
  level: config.logLevel,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Include stack trace for errors
    json() // Default to JSON format for production environments
  ),
  defaultMeta: { service: 'product-catalog-backend' },
  transports: [
    // Console transport for all environments
    new transports.Console({
      format: combine(
        colorize({ all: true }), // Colorize output for console
        developmentFormat // Use custom format for console output
      ),
    }),
    // File transport for errors in production
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // File transport for all logs in production
    new transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// If not in production, don't use file transports for simplicity.
// In a real production setup, file transports might be used, or logs sent to a log aggregation service.
if (process.env.NODE_ENV !== 'production') {
  logger.clear(); // Clear existing transports to avoid duplicate console output
  logger.add(new transports.Console({
    format: combine(
      colorize({ all: true }),
      developmentFormat
    ),
  }));
}

export default logger;
```