import { Application } from 'express';
import authRoutes from './auth.routes';
import datasetRoutes from './dataset.routes';
import dashboardRoutes from './dashboard.routes';
import visualizationRoutes from './visualization.routes';

/**
 * Sets up all API routes for the Express application.
 * @param app - The Express application instance.
 * @param apiPrefix - The base prefix for all API routes (e.g., '/api/v1').
 */
export const setupRoutes = (app: Application, apiPrefix: string): void => {
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/datasets`, datasetRoutes);
  app.use(`${apiPrefix}/dashboards`, dashboardRoutes);
  app.use(`${apiPrefix}/visualizations`, visualizationRoutes);

  // Catch-all for undefined routes
  app.use(`${apiPrefix}/*`, (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });
};