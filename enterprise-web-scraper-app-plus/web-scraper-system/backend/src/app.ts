```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import config from './config';
import { logger, requestLogger } from './middleware/logger';
import { errorHandler, ApiError } from './middleware/errorHandler';
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimiter';
import authRoutes from './api/routes/authRoutes';
import jobRoutes from './api/routes/jobRoutes';
import resultRoutes from './api/routes/resultRoutes';
import scrapingWorker from './scraper/scrapingWorker'; // Import and initialize worker
import ApiResponse from './lib/ApiResponse';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: config.env === 'production' ? 'https://your-frontend-domain.com' : '*', // Adjust in production
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json()); // Body parser for JSON requests

// Request logging middleware
app.use(requestLogger);

// Rate Limiting
app.use('/api', apiRateLimiter); // Apply to all API routes
app.use('/api/auth', authRateLimiter); // More strict for auth routes

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/results', resultRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  next(new ApiError(404, 'Not Found'));
});

// Global error handling middleware
app.use(errorHandler);

const startServer = async () => {
  // Graceful shutdown
  const gracefulShutdown = async () => {
    logger.info('Starting graceful shutdown...');
    await scrapingWorker.stopAllJobs(); // Stop all scheduled scraping jobs and close browser
    // Disconnect from DB, etc. if needed (Prisma handles connection pooling)
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.env} mode.`);
    logger.info(`Access API at http://localhost:${config.port}/api`);
  });
};

startServer();

export default app; // For testing
```