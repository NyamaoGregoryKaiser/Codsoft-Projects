import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3); // milliseconds
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} ${responseTime}ms`);
  });
  next();
};