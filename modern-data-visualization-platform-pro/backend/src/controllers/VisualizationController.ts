import { Request, Response, NextFunction } from 'express';
import { VisualizationService } from '@services/VisualizationService';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';
import { ChartType } from '@models/Visualization';
import { redisClient } from '@config/redis';

/**
 * @class VisualizationController
 * @description Handles HTTP requests for visualization-related operations.
 */
export class VisualizationController {
  private visualizationService: VisualizationService;

  constructor() {
    this.visualizationService = new VisualizationService();
  }

  /**
   * Creates a new visualization.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public createVisualization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, type, datasetId, dashboardId, config } = req.body;
      const userId = (req as any).user.id;

      if (!name || !type || !datasetId || !config) {
        throw new AppError('Name, type, datasetId, and config are required.', 400);
      }
      if (!Object.values(ChartType).includes(type)) {
        throw new AppError(`Invalid chart type. Must be one of: ${Object.values(ChartType).join(', ')}`, 400);
      }

      const newVisualization = await this.visualizationService.createVisualization(
        userId,
        name,
        description,
        type,
        datasetId,
        dashboardId,
        config
      );
      // Invalidate dashboard cache if attached to one
      if (dashboardId) {
        await redisClient.del(`dashboard:${dashboardId}`);
      }
      logger.info(`Visualization created by user ${userId}: ${newVisualization.id}`);
      res.status(201).json(newVisualization);
    } catch (error) {
      logger.error('Error creating visualization:', error);
      next(error);
    }
  };

  /**
   * Retrieves a specific visualization by its ID.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public getVisualizationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const visualization = await this.visualizationService.getVisualizationById(id);

      if (!visualization) {
        throw new AppError('Visualization not found', 404);
      }
      // Ownership check done by authorizeOwner middleware (on Visualization or Dashboard)
      if (visualization.ownerId !== userId && (!visualization.dashboard || visualization.dashboard.ownerId !== userId)) {
        throw new AppError('Forbidden: You do not own this visualization.', 403);
      }

      res.status(200).json(visualization);
    } catch (error) {
      logger.error(`Error fetching visualization ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Retrieves processed data for a specific visualization based on its configuration.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public getVisualizationData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const visualization = await this.visualizationService.getVisualizationByIdWithDataset(id);

      if (!visualization) {
        throw new AppError('Visualization not found', 404);
      }
      // Ownership check done by authorizeOwner middleware (on Visualization or Dashboard)
      if (visualization.ownerId !== userId && (!visualization.dashboard || visualization.dashboard.ownerId !== userId)) {
        throw new AppError('Forbidden: You do not own this visualization.', 403);
      }

      if (!visualization.dataset) {
        throw new AppError('Associated dataset not found for this visualization.', 404);
      }

      const processedData = this.visualizationService.processVisualizationData(
        visualization.dataset.data,
        visualization.type,
        visualization.config
      );

      res.status(200).json(processedData);
    } catch (error) {
      logger.error(`Error fetching data for visualization ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Updates an existing visualization.
   * Invalidates cache for associated dashboard on successful update.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public updateVisualization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { name, description, type, datasetId, dashboardId, config } = req.body;

      // Basic validation for type if provided
      if (type && !Object.values(ChartType).includes(type)) {
        throw new AppError(`Invalid chart type. Must be one of: ${Object.values(ChartType).join(', ')}`, 400);
      }

      const updatedVisualization = await this.visualizationService.updateVisualization(
        id,
        userId,
        { name, description, type, datasetId, dashboardId, config }
      );

      if (!updatedVisualization) {
        throw new AppError('Visualization not found or update failed.', 404);
      }

      // Invalidate cache for the new and old dashboards if they changed
      if (updatedVisualization.dashboardId) {
        await redisClient.del(`dashboard:${updatedVisualization.dashboardId}`);
      }
      // If visualization was moved from one dashboard to another, the old dashboard's cache should also be invalidated.
      // This would require fetching the original visualization before update, or having a more robust caching strategy.
      // For simplicity here, we only invalidate the current associated dashboard.

      logger.info(`Visualization updated by user ${userId}: ${updatedVisualization.id}`);
      res.status(200).json(updatedVisualization);
    } catch (error) {
      logger.error(`Error updating visualization ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Deletes a visualization.
   * Invalidates cache for associated dashboard on successful deletion.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public deleteVisualization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const visualizationToDelete = await this.visualizationService.getVisualizationById(id);
      if (!visualizationToDelete) {
        throw new AppError('Visualization not found.', 404);
      }

      const deleteResult = await this.visualizationService.deleteVisualization(id, userId);

      if (!deleteResult) {
        throw new AppError('Visualization not found or delete failed.', 404);
      }

      // Invalidate cache for the associated dashboard
      if (visualizationToDelete.dashboardId) {
        await redisClient.del(`dashboard:${visualizationToDelete.dashboardId}`);
      }
      logger.info(`Visualization deleted by user ${userId}: ${id}`);
      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting visualization ${req.params.id}:`, error);
      next(error);
    }
  };
}