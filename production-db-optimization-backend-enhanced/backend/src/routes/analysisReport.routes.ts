import { Router } from 'express';
import * as analysisReportController from '../controllers/analysisReport.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import validate from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();

const createAnalysisReportSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  targetDatabaseId: Joi.string().uuid().required(),
  slowQueries: Joi.array().items(Joi.object({
    query: Joi.string().required(),
    executionTimeMs: Joi.number().min(0).required(),
    count: Joi.number().min(0).optional(),
  })).optional(),
});

const updateAnalysisReportSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  targetDatabaseId: Joi.string().uuid().optional(),
  slowQueries: Joi.array().items(Joi.object({
    query: Joi.string().required(),
    executionTimeMs: Joi.number().min(0).required(),
    count: Joi.number().min(0).optional(),
  })).optional(),
});


router.route('/')
  .post(authMiddleware([UserRole.ADMIN, UserRole.USER]), validate(createAnalysisReportSchema), analysisReportController.createAnalysisReport)
  .get(authMiddleware([UserRole.ADMIN, UserRole.USER]), analysisReportController.getAnalysisReports);

router.route('/:id')
  .get(authMiddleware([UserRole.ADMIN, UserRole.USER]), analysisReportController.getAnalysisReport)
  .put(authMiddleware([UserRole.ADMIN, UserRole.USER]), validate(updateAnalysisReportSchema), analysisReportController.updateAnalysisReport)
  .delete(authMiddleware([UserRole.ADMIN, UserRole.USER]), analysisReportController.deleteAnalysisReport);

export default router;
```