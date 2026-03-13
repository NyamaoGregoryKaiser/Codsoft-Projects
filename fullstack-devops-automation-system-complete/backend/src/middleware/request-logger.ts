```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    logger.info(
      `${req.method} ${req.originalUrl} - ${res.statusCode} ${res.statusMessage} - ${durationInMilliseconds.toLocaleString()} ms`,
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        duration: durationInMilliseconds,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }
    );
  });

  next();
};

const getDurationInMilliseconds = (start: [number, number]) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

export default requestLogger;
```