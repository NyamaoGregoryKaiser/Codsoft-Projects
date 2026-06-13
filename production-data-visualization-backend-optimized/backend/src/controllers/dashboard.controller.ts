```typescript
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database/db';
import { APIError } from '../utils/error';
import { Dashboard, DashboardVisualization, VisualizationPosition } from '../models/Dashboard';
import { Visualization } from '../models/Visualization';
import logger from '../utils/logger';

const db = getDb();

export const createDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, visualizations } = req.body; // visualizations is an array of { id, position }
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  if (!name) {
    return next(new APIError('Missing required field: name', 400));
  }

  try {
    const dashboardInsert = db.prepare('INSERT INTO dashboards (user_id, name, description) VALUES (?, ?, ?)');
    const dashboardResult = dashboardInsert.run(userId, name, description || null);
    const dashboardId = dashboardResult.lastInsertRowid;

    if (visualizations && Array.isArray(visualizations) && visualizations.length > 0) {
      const insertVizStmt = db.prepare('INSERT INTO dashboard_visualizations (dashboard_id, visualization_id, position) VALUES (?, ?, ?)');
      for (const viz of visualizations) {
        // Optional: Verify each visualization belongs to the user
        const vizCheck = db.prepare('SELECT id FROM visualizations WHERE id = ? AND user_id = ?').get(viz.id, userId);
        if (!vizCheck) {
          logger.warn(`Attempted to add unauthorized or non-existent visualization ${viz.id} to dashboard ${dashboardId} by user ${userId}. Skipping.`);
          continue; // Skip this visualization or throw an error
        }
        insertVizStmt.run(dashboardId, viz.id, JSON.stringify(viz.position || {}));
      }
    }

    logger.info(`Dashboard created by user ${userId}: ${name} (ID: ${dashboardId})`);
    res.status(201).json({ id: dashboardId, user_id: userId, name, description, visualizations });
  } catch (error) {
    logger.error(`Error creating dashboard for user ${userId}:`, error);
    next(new APIError('Failed to create dashboard', 500, error as Error));
  }
};

export const getDashboards = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const dashboards = db.prepare('SELECT id, name, description, created_at, updated_at FROM dashboards WHERE user_id = ?').all(userId) as Dashboard[];
    logger.debug(`Retrieved ${dashboards.length} dashboards for user ${userId}`);
    res.status(200).json(dashboards);
  } catch (error) {
    logger.error(`Error fetching dashboards for user ${userId}:`, error);
    next(new APIError('Failed to fetch dashboards', 500, error as Error));
  }
};

export const getDashboardById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const dashboard = db.prepare('SELECT id, name, description, created_at, updated_at FROM dashboards WHERE id = ? AND user_id = ?').get(id, userId) as Dashboard | undefined;

    if (!dashboard) {
      return next(new APIError('Dashboard not found or unauthorized', 404));
    }

    const vizQuery = `
      SELECT
        dv.visualization_id AS id,
        dv.position,
        v.name,
        v.chart_type,
        v.config,
        v.data_source_id
      FROM dashboard_visualizations dv
      JOIN visualizations v ON dv.visualization_id = v.id
      WHERE dv.dashboard_id = ? AND v.user_id = ?;
    `;
    const visualizationsRaw = db.prepare(vizQuery).all(id, userId) as (DashboardVisualization & Pick<Visualization, 'name' | 'chart_type' | 'config' | 'data_source_id'>)[];

    const visualizations = visualizationsRaw.map(viz => ({
      ...viz,
      position: JSON.parse(viz.position as string),
      config: JSON.parse(viz.config as string),
    }));

    logger.debug(`Retrieved dashboard ${id} with ${visualizations.length} visualizations for user ${userId}`);
    res.status(200).json({
      ...dashboard,
      visualizations,
    });
  } catch (error) {
    logger.error(`Error fetching dashboard ${id} for user ${userId}:`, error);
    next(new APIError('Failed to fetch dashboard', 500, error as Error));
  }
};

export const updateDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, description, visualizations } = req.body;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  if (!name && !description && !visualizations) {
    return next(new APIError('No update data provided', 400));
  }

  try {
    const dashboardToUpdate = db.prepare('SELECT id FROM dashboards WHERE id = ? AND user_id = ?').get(id, userId);
    if (!dashboardToUpdate) {
      return next(new APIError('Dashboard not found or unauthorized', 404));
    }

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (name) {
      fieldsToUpdate.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) { // Allow description to be nullified
      fieldsToUpdate.push('description = ?');
      values.push(description);
    }
    fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP');

    if (fieldsToUpdate.length > 0) {
      const stmt = db.prepare(`UPDATE dashboards SET ${fieldsToUpdate.join(', ')} WHERE id = ? AND user_id = ?`);
      stmt.run(...values, id, userId);
    }

    // Handle visualizations updates
    if (visualizations !== undefined) {
      // Clear existing visualizations for this dashboard
      db.prepare('DELETE FROM dashboard_visualizations WHERE dashboard_id = ?').run(id);

      if (Array.isArray(visualizations) && visualizations.length > 0) {
        const insertVizStmt = db.prepare('INSERT INTO dashboard_visualizations (dashboard_id, visualization_id, position) VALUES (?, ?, ?)');
        for (const viz of visualizations) {
          // Optional: Verify each visualization belongs to the user
          const vizCheck = db.prepare('SELECT id FROM visualizations WHERE id = ? AND user_id = ?').get(viz.id, userId);
          if (!vizCheck) {
            logger.warn(`Attempted to add unauthorized or non-existent visualization ${viz.id} to dashboard ${id} by user ${userId} during update. Skipping.`);
            continue;
          }
          insertVizStmt.run(id, viz.id, JSON.stringify(viz.position || {}));
        }
      }
    }

    logger.info(`Dashboard ${id} updated by user ${userId}`);
    res.status(200).json({ message: 'Dashboard updated successfully' });
  } catch (error) {
    logger.error(`Error updating dashboard ${id} for user ${userId}:`, error);
    next(new APIError('Failed to update dashboard', 500, error as Error));
  }
};

export const deleteDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const result = db.prepare('DELETE FROM dashboards WHERE id = ? AND user_id = ?').run(id, userId);

    if (result.changes === 0) {
      return next(new APIError('Dashboard not found or unauthorized', 404));
    }
    logger.info(`Dashboard ${id} deleted by user ${userId}`);
    res.status(200).json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting dashboard ${id} for user ${userId}:`, error);
    next(new APIError('Failed to delete dashboard', 500, error as Error));
  }
};
```