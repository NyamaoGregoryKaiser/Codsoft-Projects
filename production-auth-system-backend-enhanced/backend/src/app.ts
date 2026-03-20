import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';

import { errorHandler } from './middleware/errorHandler.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import { CustomError } from './types/errors';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks
app.use(compression()); // Compress all responses

// Enable CORS for frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));

// Request parsers
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads
app.use(cookieParser()); // Parse cookies from incoming requests

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Logger for development
} else {
  // Production logging, can be more detailed or piped to a log management service
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// Apply rate limiting to all requests
app.use(apiRateLimiter);

// API Routes
app.get('/', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ message: 'Welcome to the Auth System API!' });
});
app.use('/api/v1/auth', authRoutes);

// Catch-all for undefined routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new CustomError(`Can't find ${req.originalUrl} on this server!`, StatusCodes.NOT_FOUND));
});

// Global error handler
app.use(errorHandler);

export default app;