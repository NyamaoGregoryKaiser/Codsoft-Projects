import { Request, Response, NextFunction } from 'express';
import { EntityTarget, Repository } from 'typeorm';
import { AppDataSource } from '@db/data-source';
import { AppError } from '@utils/app-error';
import { User } from '@models/User';
import { Dataset } from '@models/Dataset';
import { Dashboard } from '@models/Dashboard';
import { Visualization } from '@models/Visualization';
import logger from '@config/logger';

// Type alias for entities that have an ownerId property
type OwnedEntity = User | Dataset | Dashboard | Visualization;

/**
 * Higher-order middleware function to authorize access based on resource ownership.
 * It checks if the authenticated user (from `req.user.id`) is the owner of the resource.
 *
 * @param entityClass The TypeORM entity class (e.g., `Dataset`, `Dashboard`, `Visualization`).
 * @returns An Express middleware function.
 */
export const authorizeOwner = (entityClass: EntityTarget<OwnedEntity>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params; // ID of the resource from URL parameter
      const userId = req.user?.id; // Authenticated user ID from authMiddleware

      if (!userId) {
        // This should ideally not happen if authMiddleware runs first
        throw new AppError('User not authenticated for authorization check.', 401);
      }

      const repository: Repository<OwnedEntity> = AppDataSource.getRepository(entityClass);
      const resource = await repository.findOne({
        where: { id: id as any }, // TypeORM's findOne requires id as primary key
        relations: entityClass === Visualization ? ['dashboard'] : [], // Load dashboard for viz ownership check
      });

      if (!resource) {
        throw new AppError(`${entityClass.name} not found.`, 404);
      }

      let isOwner = false;

      // Special handling for Visualization, which can be owned directly or via its dashboard
      if (entityClass === Visualization) {
        const viz = resource as Visualization;
        isOwner = viz.ownerId === userId || (viz.dashboard && viz.dashboard.ownerId === userId);
      } else {
        // For other entities, a direct ownerId check is sufficient
        isOwner = (resource as any).ownerId === userId;
      }

      if (!isOwner) {
        throw new AppError(`Forbidden: You do not have permission to access this ${entityClass.name}.`, 403);
      }

      next(); // User is authorized, proceed to next middleware/controller
    } catch (error) {
      logger.error(`Authorization failed for resource ${req.params.id} of type ${entityClass.name}:`, error);
      next(error); // Pass error to global error handler
    }
  };
};