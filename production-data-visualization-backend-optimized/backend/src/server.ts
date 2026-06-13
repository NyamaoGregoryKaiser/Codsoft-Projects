```typescript
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

// Load environment variables
dotenv.config();

import { initializeDatabase } from './database/db';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimit';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import dataSourceRoutes from './routes/dataSource.routes';
import visualizationRoutes from './routes/visualization.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database Initialization
initializeDatabase().then(() => {
  logger.info('Database initialized and migrations applied.');

  // Middleware
  app.use(cors({
    origin: process.env.REACT_APP_API_BASE_URL ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') : 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(DATA_DIR)); // Serve uploaded files statically

  // Apply rate limiting to all API routes
  app.use('/api', rateLimitMiddleware);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/data-sources', dataSourceRoutes);
  app.use('/api/visualizations', visualizationRoutes);
  app.use('/api/dashboards', dashboardRoutes);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // Root route for API documentation (or redirect to frontend)
  app.get('/api', (req: Request, res: Response) => {
    res.status(200).json({ message: 'Welcome to the Data Visualization API. See /api-docs for documentation (if available).' });
  });

  // Frontend build serving (optional, if backend also serves frontend)
  // For this setup, frontend runs on its own dev server or Nginx
  // if (process.env.NODE_ENV === 'production') {
  //   app.use(express.static(path.join(__dirname, '../../frontend/build')));
  //   app.get('*', (req, res) => {
  //     res.sendFile(path.resolve(__dirname, '../../frontend/build', 'index.html'));
  //   });
  // }


  // Global Error Handler (must be the last middleware)
  app.use(errorHandler);

  // Start the server
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Data directory: ${DATA_DIR}`);
  });

}).catch((err) => {
  logger.error('Failed to initialize database:', err);
  process.exit(1);
});
```