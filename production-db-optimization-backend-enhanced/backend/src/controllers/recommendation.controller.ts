import { Request, Response, NextFunction } from 'express';
import * as recommendationService from '../services/recommendation.service';
import { ApiError } from '../middlewares/error.middleware';

const createRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, analysisReportId, targetDatabaseId, assignedToId } = req.body;
    if (!req.user?.id) {
      throw new ApiError(401, 'User not authenticated.');
    }
    const newRecommendation = await recommendationService.createRecommendation({
      title, description, priority, analysisReportId, targetDatabaseId, recommendedById: req.user.id, assignedToId
    });
    res.status(201).json(newRecommendation);
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as any;
    const targetDatabaseId = req.query.targetDatabaseId as string | undefined;
    const assignedToId = req.query.assignedToId as string | undefined;

    const recommendations = await recommendationService.getAllRecommendations(
      page, limit, status, targetDatabaseId, assignedToId
    );
    res.status(200).json(recommendations);
  } catch (error) {
    next(error);
  }
};

const getRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recommendation = await recommendationService.getRecommendationById(req.params.id);
    if (!recommendation) {
      throw new ApiError(404, 'Recommendation not found');
    }
    res.status(200).json(recommendation);
  } catch (error) {
    next(error);
  }
};

const updateRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedRecommendation = await recommendationService.updateRecommendation(req.params.id, req.body);
    res.status(200).json(updatedRecommendation);
  } catch (error) {
    next(error);
  }
};

const deleteRecommendation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await recommendationService.deleteRecommendation(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  createRecommendation,
  getRecommendations,
  getRecommendation,
  updateRecommendation,
  deleteRecommendation,
};
```