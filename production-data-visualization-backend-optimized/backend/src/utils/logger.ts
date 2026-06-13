```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json() // Use JSON format for production logs
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple() // Simple format for console in development
      ),
    }),
    // New: Add a file transport for production (optional)
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, log to the console with a pretty format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        ({ level, message, timestamp, stack, ...metadata }) => {
          let log = `${timestamp} ${level}: ${message}`;
          if (stack) {
            log += `\n${stack}`;
          }
          if (Object.keys(metadata).length) {
            log += ` ${JSON.stringify(metadata)}`;
          }
          return log;
        }
      )
    ),
  }));
}

export default logger;
```