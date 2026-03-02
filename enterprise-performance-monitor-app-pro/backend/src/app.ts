import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from './database/data-source';
import { Logger, requestLogger } from './config/winston';
import { errorHandler, notFoundHandler } from './middleware/error';
import { apiRateLimiter } from './middleware/rateLimit';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import applicationRoutes from './routes/applications';
import pageRoutes from './routes/pages';
import performanceRoutes from './routes/performance';
import reportRoutes from './routes/reports';

const app = express();

// --- Database Connection ---
AppDataSource.initialize()
  .then(() => {
    Logger.info('Database connected successfully!');
  })
  .catch((error) => {
    Logger.error('Database connection error:', error);
    process.exit(1);
  });

// --- Middleware ---
app.use(express.json()); // Body parser for JSON
app.use(cors());         // Enable CORS for all origins (configure for production)
app.use(helmet());       // Basic security headers
app.use(requestLogger);  // Custom request logger
app.use(apiRateLimiter); // Apply general API rate limiting

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/applications', pageRoutes); // Pages are nested under applications
app.use('/api/performance', performanceRoutes); // No general API rate limiting here, specific one used
app.use('/api/reports', reportRoutes);

// --- Error Handling ---
app.use(notFoundHandler); // 404 handler for unmatched routes
app.use(errorHandler);    // Global error handler

export default app;