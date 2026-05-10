import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    logger.info(`[${method}] ${originalUrl} - ${statusCode} - ${durationInMilliseconds.toLocaleString()}ms`, {
      method,
      url: originalUrl,
      statusCode,
      duration: durationInMilliseconds,
      ip,
      userAgent: req.get('user-agent'),
      requestId: req.headers['x-request-id'] || req.headers['X-Request-ID'], // If you use a request ID middleware
    });
  });

  next();
};

const getDurationInMilliseconds = (start: [number, number]) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};