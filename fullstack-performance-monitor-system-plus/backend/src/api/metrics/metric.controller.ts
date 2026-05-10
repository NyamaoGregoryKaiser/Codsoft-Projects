import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import * as metricService from './metric.service';
import { IngestMetricSchema, GetMetricsQuerySchema } from './metric.validation';
import { logger } from '../../utils/logger';

export const ingestMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = IngestMetricSchema.parse(req.body);
    const projectId = (req as any).project.id; // From validateApiKey middleware

    await metricService.ingestMetrics(projectId, validatedData.metrics);

    res.status(202).json({
      status: 'success',
      message: 'Metrics accepted for processing',
    });
  } catch (error) {
    logger.error('Error ingesting metrics:', error);
    next(error);
  }
};

export const getProjectSummaryMetrics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId;
    const { period } = GetMetricsQuerySchema.parse(req.query);

    const summary = await metricService.getProjectSummaryMetrics(projectId, period);

    res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    logger.error('Error getting project summary metrics:', error);
    next(error);
  }
};

export const getMetricsTimeline = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId;
    const { period, metricType } = GetMetricsQuerySchema.parse(req.query);

    const timelineData = await metricService.getMetricsTimeline(projectId, metricType, period);

    res.status(200).json({
      status: 'success',
      data: timelineData,
    });
  } catch (error) {
    logger.error('Error getting metrics timeline:', error);
    next(error);
  }
};

export const getRecentErrors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId;
    const errors = await metricService.getRecentErrors(projectId);

    res.status(200).json({
      status: 'success',
      data: errors,
    });
  } catch (error) {
    logger.error('Error getting recent errors:', error);
    next(error);
  }
};