```typescript
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database/db';
import { APIError } from '../utils/error';
import { Visualization, VisualizationConfig, ChartType } from '../models/Visualization';
import { DataSource } from '../models/DataSource';
import logger from '../utils/logger';

const db = getDb();

export const createVisualization = async (req: Request, res: Response, next: NextFunction) => {
  const { data_source_id, name, chart_type, config } = req.body;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  if (!data_source_id || !name || !chart_type || !config) {
    return next(new APIError('Missing required fields: data_source_id, name, chart_type, config', 400));
  }

  if (!Object.values(ChartType).includes(chart_type)) {
    return next(new APIError(`Invalid chart type. Must be one of: ${Object.values(ChartType).join(', ')}`, 400));
  }

  try {
    // Verify data source belongs to the user
    const dataSource = db.prepare('SELECT id FROM data_sources WHERE id = ? AND user_id = ?').get(data_source_id, userId) as Pick<DataSource, 'id'> | undefined;
    if (!dataSource) {
      return next(new APIError('Data source not found or unauthorized', 404));
    }

    const result = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(
      userId,
      data_source_id,
      name,
      chart_type,
      JSON.stringify(config)
    );
    const visualizationId = result.lastInsertRowid;

    logger.info(`Visualization created by user ${userId}: ${name} (ID: ${visualizationId})`);
    res.status(201).json({ id: visualizationId, user_id: userId, data_source_id, name, chart_type, config });
  } catch (error) {
    logger.error(`Error creating visualization for user ${userId}:`, error);
    next(new APIError('Failed to create visualization', 500, error as Error));
  }
};

export const getVisualizations = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const visualizations = db.prepare('SELECT id, name, chart_type, config, data_source_id, created_at, updated_at FROM visualizations WHERE user_id = ?').all(userId) as Visualization[];
    const parsedVisualizations = visualizations.map(viz => ({
      ...viz,
      config: JSON.parse(viz.config as string),
    }));
    logger.debug(`Retrieved ${parsedVisualizations.length} visualizations for user ${userId}`);
    res.status(200).json(parsedVisualizations);
  } catch (error) {
    logger.error(`Error fetching visualizations for user ${userId}:`, error);
    next(new APIError('Failed to fetch visualizations', 500, error as Error));
  }
};

export const getVisualizationById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const visualization = db.prepare('SELECT id, name, chart_type, config, data_source_id, created_at, updated_at FROM visualizations WHERE id = ? AND user_id = ?').get(id, userId) as Visualization | undefined;

    if (!visualization) {
      return next(new APIError('Visualization not found or unauthorized', 404));
    }
    logger.debug(`Retrieved visualization ${id} for user ${userId}`);
    res.status(200).json({
      ...visualization,
      config: JSON.parse(visualization.config as string),
    });
  } catch (error) {
    logger.error(`Error fetching visualization ${id} for user ${userId}:`, error);
    next(new APIError('Failed to fetch visualization', 500, error as Error));
  }
};

export const updateVisualization = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, chart_type, config, data_source_id } = req.body; // data_source_id can be updated if needed
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  if (!name && !chart_type && !config && !data_source_id) {
    return next(new APIError('No update data provided', 400));
  }
  if (chart_type && !Object.values(ChartType).includes(chart_type)) {
    return next(new APIError(`Invalid chart type. Must be one of: ${Object.values(ChartType).join(', ')}`, 400));
  }


  try {
    const visualizationToUpdate = db.prepare('SELECT id FROM visualizations WHERE id = ? AND user_id = ?').get(id, userId);
    if (!visualizationToUpdate) {
      return next(new APIError('Visualization not found or unauthorized', 404));
    }

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name) {
      fieldsToUpdate.push('name = ?');
      values.push(name);
    }
    if (chart_type) {
      fieldsToUpdate.push('chart_type = ?');
      values.push(chart_type);
    }
    if (config) {
      fieldsToUpdate.push('config = ?');
      values.push(JSON.stringify(config));
    }
    if (data_source_id) {
        // Verify new data source belongs to the user
        const newDataSource = db.prepare('SELECT id FROM data_sources WHERE id = ? AND user_id = ?').get(data_source_id, userId);
        if (!newDataSource) {
            return next(new APIError('New data source not found or unauthorized', 404));
        }
        fieldsToUpdate.push('data_source_id = ?');
        values.push(data_source_id);
    }

    fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');

    if (fieldsToUpdate.length === 0) {
      return next(new APIError('No valid fields to update', 400));
    }

    const stmt = db.prepare(`UPDATE visualizations SET ${fieldsToUpdate.join(', ')} WHERE id = ? AND user_id = ?`);
    const result = stmt.run(...values, id, userId);

    if (result.changes === 0) {
      return next(new APIError('Failed to update visualization or no changes made', 500));
    }
    logger.info(`Visualization ${id} updated by user ${userId}`);
    res.status(200).json({ message: 'Visualization updated successfully' });
  } catch (error) {
    logger.error(`Error updating visualization ${id} for user ${userId}:`, error);
    next(new APIError('Failed to update visualization', 500, error as Error));
  }
};

export const deleteVisualization = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const result = db.prepare('DELETE FROM visualizations WHERE id = ? AND user_id = ?').run(id, userId);

    if (result.changes === 0) {
      return next(new APIError('Visualization not found or unauthorized', 404));
    }
    logger.info(`Visualization ${id} deleted by user ${userId}`);
    res.status(200).json({ message: 'Visualization deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting visualization ${id} for user ${userId}:`, error);
    next(new APIError('Failed to delete visualization', 500, error as Error));
  }
};
```