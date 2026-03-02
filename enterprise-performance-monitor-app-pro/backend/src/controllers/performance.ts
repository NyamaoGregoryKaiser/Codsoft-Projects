import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from '../services/performance';
import { Logger } from '../config/winston';

const performanceService = new PerformanceService();

export const ingestPerformanceMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = req.apiKeyApplication!.id; // Guaranteed to exist by authenticateApiKey middleware
    const metrics = req.body.metrics; // Array of metric objects

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ message: 'Metrics array is required and cannot be empty.' });
    }

    const result = await performanceService.ingestMetrics(applicationId, metrics);
    res.status(202).json({ message: `Successfully ingested ${result.count} metrics.`, count: result.count });
  } catch (error: any) {
    Logger.error(`Error during performance metric ingestion: ${error.message}`, { error: error.stack, body: req.body });
    next(error);
  }
};