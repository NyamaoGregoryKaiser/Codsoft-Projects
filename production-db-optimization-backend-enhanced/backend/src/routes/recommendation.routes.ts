import { Router } from 'express';
import * as recommendationController from '../controllers/recommendation.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { RecommendationStatus, UserRole } from '@prisma/client';
import validate from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();

const createRecommendationSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  priority: Joi.number().min(0).max(2).default(0), // 0: Low, 1: Medium, 2: High
  analysisReportId: Joi.string().uuid().required(),
  targetDatabaseId: Joi.string().uuid().required(),
  assignedToId: Joi.string().uuid().optional().allow(null),
});

const updateRecommendationSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid(...Object.values(RecommendationStatus)).optional(),
  priority: Joi.number().min(0).max(2).optional(),
  assignedToId: Joi.string().uuid().optional().allow(null),
  implementationDetails: Joi.object().optional(), // Can be any JSON structure
});

router.route('/')
  .post(authMiddleware([UserRole.ADMIN, UserRole.USER]), validate(createRecommendationSchema), recommendationController.createRecommendation)
  .get(authMiddleware([UserRole.ADMIN, UserRole.USER]), recommendationController.getRecommendations);

router.route('/:id')
  .get(authMiddleware([UserRole.ADMIN, UserRole.USER]), recommendationController.getRecommendation)
  .put(authMiddleware([UserRole.ADMIN, UserRole.USER]), validate(updateRecommendationSchema), recommendationController.updateRecommendation)
  .delete(authMiddleware([UserRole.ADMIN, UserRole.USER]), recommendationController.deleteRecommendation);

export default router;
```