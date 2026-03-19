import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { StatusCodes } from 'http-status-codes';

import { errorConverter, errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { authRateLimiter } from './middleware/rateLimit.middleware';
import { requestLogger } from './middleware/logger.middleware';
import apiRoutes from './routes';
import { env } from './config/env';

const app: Application = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS for all routes
app.use(cors());

// Parse incoming request bodies
app.use(express.json()); // For application/json
app.use(express.urlencoded({ extended: true })); // For application/x-www-form-urlencoded

// Request logging (using custom Winston logger and Morgan for development)
app.use(requestLogger); // Custom Winston logger
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Morgan for development console output
}

// Apply rate limiter to auth routes
app.use('/api/v1/auth', authRateLimiter);

// API routes
app.use('/api/v1', apiRoutes);

// Catch-all for undefined routes
app.use(notFoundHandler);

// Convert errors to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

export default app;