import { Request, Response, NextFunction } from 'express';
import { Logger } from '../config/winston';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  Logger.http(`[REQUEST] ${req.method} ${req.originalUrl} from ${req.ip}`);
  // You can also log request body or headers if needed, but be mindful of sensitive data
  next();
};

export const performanceDataLogger = (req: Request, res: Response, next: NextFunction) => {
  // This specific logger is for the performance data ingestion endpoint
  // We want to log successful data ingesion at info level
  const oldJson = res.json;
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      Logger.info(`[PERF_DATA_INGEST] Application ID: ${req.apiKeyApplication?.id || 'N/A'}, Status: ${res.statusCode}, Data: ${JSON.stringify(req.body).substring(0, 200)}...`);
    }
    return oldJson.call(this, body);
  };
  next();
};