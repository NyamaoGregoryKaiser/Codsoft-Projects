import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.http(`[${req.method}] ${req.originalUrl} from ${req.ip}`);
  next();
};