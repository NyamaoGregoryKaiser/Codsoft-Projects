```typescript
import { Request, Response, NextFunction } from 'express';
import { visualizationService } from '../services/visualization.service';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';

export const visualizationController = {
  async createVisualization(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const visualization = await visualizationService.createVisualization(req.user.id, req.body);
      res.status(201).json({ message: 'Visualization created successfully', visualization });
    } catch (error) {
      next(error);
    }
  },

  async getVisualizations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const visualizations = await visualizationService.getVisualizationsByUserId(req.user.id);
      res.status(200).json(visualizations);
    } catch (error) {
      next(error);
    }
  },

  async getVisualizationById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const vizId = req.params.id;
      const visualization = await visualizationService.getVisualizationById(vizId, req.user.id, req.user.role === 'admin');
      res.status(200).json(visualization);
    } catch (error) {
      next(error);
    }
  },

  async updateVisualization(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const vizId = req.params.id;
      const visualization = await visualizationService.updateVisualization(vizId, req.user.id, req.body, req.user.role === 'admin');
      res.status(200).json({ message: 'Visualization updated successfully', visualization });
    } catch (error) {
      next(error);
    }
  },

  async deleteVisualization(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const vizId = req.params.id;
      await visualizationService.deleteVisualization(vizId, req.user.id, req.user.role === 'admin');
      res.status(200).json({ message: 'Visualization deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getVisualizationData(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const vizId = req.params.id;
      const visualization = await visualizationService.getVisualizationById(vizId, req.user.id, req.user.role === 'admin');

      if (!visualization.dataset) {
        throw new APIError('Visualization is not linked to a dataset', 400);
      }

      const processedData = await visualizationService.processDataForChart(visualization);
      res.status(200).json(processedData);
    } catch (error) {
      next(error);
    }
  }
};
```