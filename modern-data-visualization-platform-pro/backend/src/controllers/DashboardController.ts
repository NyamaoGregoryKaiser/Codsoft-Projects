import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '@services/DashboardService';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';
import { redisClient } from '@config/redis';

/**
 * @class DashboardController
 * @description Handles HTTP requests for dashboard-related operations.
 */
export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Creates a new dashboard.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public createDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description } = req.body;
      const userId = (req as any).user.id;

      if (!name) {
        throw new AppError('Dashboard name is required.', 400);
      }

      const newDashboard = await this.dashboardService.createDashboard(userId, name, description);
      logger.info(`Dashboard created by user ${userId}: ${newDashboard.id}`);
      res.status(201).json(newDashboard);
    } catch (error) {
      logger.error('Error creating dashboard:', error);
      next(error);
    }
  };

  /**
   * Retrieves all dashboards for the authenticated user.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public getDashboards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const dashboards = await this.dashboardService.getDashboardsByUserId(userId);
      res.status(200).json(dashboards);
    } catch (error) {
      logger.error('Error fetching dashboards:', error);
      next(error);
    }
  };

  /**
   * Retrieves a specific dashboard by its ID, including its visualizations.
   * This endpoint is cached by `cacheMiddleware`.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public getDashboardById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id; // From authMiddleware

      const dashboard = await this.dashboardService.getDashboardByIdWithVisualizations(id);

      if (!dashboard) {
        throw new AppError('Dashboard not found', 404);
      }
      // Ownership check is handled by authorizeOwner middleware
      if (dashboard.ownerId !== userId) {
        throw new AppError('Forbidden: You do not own this dashboard.', 403);
      }

      res.status(200).json(dashboard);
    } catch (error) {
      logger.error(`Error fetching dashboard ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Updates an existing dashboard.
   * Invalidates cache for this dashboard on successful update.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public updateDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { name, description } = req.body;

      const updatedDashboard = await this.dashboardService.updateDashboard(id, userId, { name, description });

      if (!updatedDashboard) {
        throw new AppError('Dashboard not found or update failed.', 404);
      }

      // Invalidate cache for this dashboard
      await redisClient.del(`dashboard:${id}`);
      logger.info(`Dashboard updated by user ${userId}: ${updatedDashboard.id}. Cache invalidated.`);
      res.status(200).json(updatedDashboard);
    } catch (error) {
      logger.error(`Error updating dashboard ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Deletes a dashboard.
   * Invalidates cache for this dashboard on successful deletion.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public deleteDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const deleteResult = await this.dashboardService.deleteDashboard(id, userId);

      if (!deleteResult) {
        throw new AppError('Dashboard not found or delete failed.', 404);
      }

      // Invalidate cache for this dashboard
      await redisClient.del(`dashboard:${id}`);
      logger.info(`Dashboard deleted by user ${userId}: ${id}. Cache invalidated.`);
      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting dashboard ${req.params.id}:`, error);
      next(error);
    }
  };
}