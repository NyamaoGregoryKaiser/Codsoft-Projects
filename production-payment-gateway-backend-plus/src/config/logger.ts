```typescript
import { createLogger, format, transports } from "winston";
import config from "./index";

const { combine, timestamp, printf, colorize, errors, json } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }), // Include stack trace for errors
    config.NODE_ENV === "production" ? json() : colorize(), // JSON format in prod, colorized in dev
    config.NODE_ENV === "production" ? undefined : logFormat // Custom format in dev
  ),
  transports: [
    new transports.Console(),
    // Add file transports for production
    // new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new transports.File({ filename: 'logs/combined.log' }),
  ],
  exceptionHandlers: [
    new transports.Console(),
    // new transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new transports.Console(),
    // new transports.File({ filename: 'logs/rejections.log' }),
  ],
});

export default logger;
```