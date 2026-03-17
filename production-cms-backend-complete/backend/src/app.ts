import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import xss from 'xss-clean';
import { errorHandler, CustomError } from './middlewares/errorHandler';
import { apiRateLimiter } from './middlewares/rateLimiter';
import { requestLogger } from './middlewares/logger';
import apiRoutes from './routes';
import { logger } from './config/logger';

const app: Application = express();

// Security Middlewares
app.use(helmet()); // Set security headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourfrontend.com' : '*', // Restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); // Enable CORS
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data
app.use(xss()); // Protect against XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate limiting
app.use(apiRateLimiter);

// Custom Request Logger
app.use(requestLogger);

// Mount API routes
app.use('/api/v1', apiRoutes);

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new CustomError(404, `Not Found - ${req.originalUrl}`));
});

// Centralized Error Handling
app.use(errorHandler);

export default app;