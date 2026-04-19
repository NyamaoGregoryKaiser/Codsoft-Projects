```typescript
import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { APIError } from '../utils/errors';
import { logger } from '../utils/logger';

export const dashboardController = {
  async createDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const dashboard = await dashboardService.createDashboard(req.user.id, req.body);
      res.status(201).json({ message: 'Dashboard created successfully', dashboard });
    } catch (error) {
      next(error);
    }
  },

  async getDashboards(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const dashboards = await dashboardService.getDashboardsByUserId(req.user.id);
      res.status(200).json(dashboards);
    } catch (error) {
      next(error);
    }
  },

  async getDashboardById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const dashboardId = req.params.id;
      const dashboard = await dashboardService.getDashboardById(dashboardId, req.user.id, req.user.role === 'admin');
      res.status(200).json(dashboard);
    } catch (error) {
      next(error);
    }
  },

  async updateDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const dashboardId = req.params.id;
      const dashboard = await dashboardService.updateDashboard(dashboardId, req.user.id, req.body, req.user.role === 'admin');
      res.status(200).json({ message: 'Dashboard updated successfully', dashboard });
    } catch (error) {
      next(error);
    }
  },

  async deleteDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new APIError('User not authenticated', 401);
      }
      const dashboardId = req.params.id;
      await dashboardService.deleteDashboard(dashboardId, req.user.id, req.user.role === 'admin');
      res.status(200).json({ message: 'Dashboard deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
```