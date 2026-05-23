import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const responseTimeMs = (diff[0] * 1e9 + diff[1]) / 1e6; // Convert to milliseconds
    logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTimeMs.toFixed(2)}ms`);
  });

  next();
};