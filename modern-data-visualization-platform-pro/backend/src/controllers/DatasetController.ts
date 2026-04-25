import { Request, Response, NextFunction } from 'express';
import { DatasetService } from '@services/DatasetService';
import { AppError } from '@utils/app-error';
import logger from '@config/logger';

/**
 * @class DatasetController
 * @description Handles HTTP requests for dataset-related operations.
 */
export class DatasetController {
  private datasetService: DatasetService;

  constructor() {
    this.datasetService = new DatasetService();
  }

  /**
   * Uploads a new dataset.
   * Requires `name`, `data` (array of objects), and optionally `description`.
   * @param req - Express request object (expects userId from authMiddleware).
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public uploadDataset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, data } = req.body;
      const userId = (req as any).user.id;

      if (!name || !data || !Array.isArray(data) || data.length === 0) {
        throw new AppError('Dataset name and data array are required and cannot be empty.', 400);
      }
      if (data.some(row => typeof row !== 'object' || row === null)) {
        throw new AppError('Dataset data must be an array of JSON objects.', 400);
      }

      const newDataset = await this.datasetService.createDataset(userId, name, description, data);
      logger.info(`Dataset created by user ${userId}: ${newDataset.id}`);
      res.status(201).json(newDataset);
    } catch (error) {
      logger.error('Error uploading dataset:', error);
      next(error);
    }
  };

  /**
   * Retrieves all datasets belonging to the authenticated user.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public getDatasets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const datasets = await this.datasetService.getDatasetsByUserId(userId);
      res.status(200).json(datasets);
    } catch (error) {
      logger.error('Error fetching datasets:', error);
      next(error);
    }
  };

  /**
   * Retrieves a specific dataset by its ID.
   * Requires `authMiddleware` and `authorizeOwner` to ensure user ownership.
   * @param req - Express request object (expects datasetId in params).
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public getDatasetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id; // From authMiddleware
      const dataset = await this.datasetService.getDatasetById(id);

      if (!dataset) {
        throw new AppError('Dataset not found', 404);
      }
      // Ownership check is done by authorizeOwner middleware, but good to ensure service returns correct data
      if (dataset.ownerId !== userId) {
         // This should ideally be caught by authorizeOwner before, but as a fallback
        throw new AppError('Forbidden: You do not own this dataset.', 403);
      }

      res.status(200).json(dataset);
    } catch (error) {
      logger.error(`Error fetching dataset ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Updates an existing dataset.
   * Requires `authMiddleware` and `authorizeOwner`.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public updateDataset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { name, description, data } = req.body;

      // Basic validation for updates
      if (data && (!Array.isArray(data) || data.length === 0 || data.some(row => typeof row !== 'object' || row === null))) {
        throw new AppError('Dataset data must be an array of JSON objects if provided.', 400);
      }

      const updatedDataset = await this.datasetService.updateDataset(id, userId, { name, description, data });

      if (!updatedDataset) {
        throw new AppError('Dataset not found or update failed.', 404);
      }
      logger.info(`Dataset updated by user ${userId}: ${updatedDataset.id}`);
      res.status(200).json(updatedDataset);
    } catch (error) {
      logger.error(`Error updating dataset ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Deletes a dataset.
   * Requires `authMiddleware` and `authorizeOwner`.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public deleteDataset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const deleteResult = await this.datasetService.deleteDataset(id, userId);

      if (!deleteResult) {
        throw new AppError('Dataset not found or delete failed.', 404);
      }
      logger.info(`Dataset deleted by user ${userId}: ${id}`);
      res.status(204).send(); // No content on successful deletion
    } catch (error) {
      logger.error(`Error deleting dataset ${req.params.id}:`, error);
      next(error);
    }
  };

  /**
   * Retrieves a preview of a dataset's data.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  public getDatasetPreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 100;

      const dataset = await this.datasetService.getDatasetById(id);

      if (!dataset) {
        throw new AppError('Dataset not found', 404);
      }
      if (dataset.ownerId !== userId) {
        throw new AppError('Forbidden: You do not own this dataset.', 403);
      }

      const previewData = dataset.data.slice(0, limit);
      res.status(200).json(previewData);
    } catch (error) {
      logger.error(`Error fetching dataset preview ${req.params.id}:`, error);
      next(error);
    }
  };
}