import { Request, Response, NextFunction } from 'express';
import * as analysisReportService from '../services/analysisReport.service';
import { ApiError } from '../middlewares/error.middleware';

const createAnalysisReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, targetDatabaseId, slowQueries } = req.body;
    if (!req.user?.id) {
      throw new ApiError(401, 'User not authenticated.');
    }
    const newReport = await analysisReportService.createAnalysisReport({
      title, description, targetDatabaseId, slowQueries, analystId: req.user.id, reportDate: new Date()
    });
    res.status(201).json(newReport);
  } catch (error) {
    next(error);
  }
};

const getAnalysisReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const targetDatabaseId = req.query.targetDatabaseId as string | undefined;
    const reports = await analysisReportService.getAllAnalysisReports(page, limit, targetDatabaseId);
    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

const getAnalysisReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await analysisReportService.getAnalysisReportById(req.params.id);
    if (!report) {
      throw new ApiError(404, 'Analysis Report not found');
    }
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

const updateAnalysisReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedReport = await analysisReportService.updateAnalysisReport(req.params.id, req.body);
    res.status(200).json(updatedReport);
  } catch (error) {
    next(error);
  }
};

const deleteAnalysisReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await analysisReportService.deleteAnalysisReport(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  createAnalysisReport,
  getAnalysisReports,
  getAnalysisReport,
  updateAnalysisReport,
  deleteAnalysisReport,
};
```