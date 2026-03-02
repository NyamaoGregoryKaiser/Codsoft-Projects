import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report';
import { Logger } from '../config/winston';

const reportService = new ReportService();

export const getApplicationOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId } = req.params;
    const periodDays = parseInt(req.query.periodDays as string) || 7; // Default to 7 days
    const overview = await reportService.getApplicationOverview(applicationId, periodDays);
    res.status(200).json(overview);
  } catch (error: any) {
    next(error);
  }
};

export const getPageMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, pageId } = req.params;
    const metricType = req.query.metricType as string;
    const periodDays = parseInt(req.query.periodDays as string) || 7;

    if (!metricType) {
      return res.status(400).json({ message: 'Metric type is required for page metrics.' });
    }

    const metrics = await reportService.getPageMetrics(applicationId, pageId, metricType, periodDays);
    res.status(200).json(metrics);
  } catch (error: any) {
    next(error);
  }
};

export const getMetricTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationId, metricType } = req.params;
    const pageId = req.query.pageId as string | undefined; // Optional page filter
    const periodDays = parseInt(req.query.periodDays as string) || 30; // Default to 30 days

    const trends = await reportService.getMetricTrends(applicationId, metricType, pageId, periodDays);
    res.status(200).json(trends);
  } catch (error: any) {
    next(error);
  }
};