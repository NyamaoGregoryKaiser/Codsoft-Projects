import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authRouter } from './api/auth/auth.routes';
import { projectRouter } from './api/projects/project.routes';
import { metricRouter } from './api/metrics/metric.routes';
import { AppError } from './error';
import { checkHealth } from './middleware/healthCheck';

dotenv.config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*', // Be more specific in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-AppInsight-Api-Key'],
}));

// Body Parser
app.use(express.json());

// Request Logging
app.use(requestLogger);

// API Routes
app.get('/api/health', checkHealth); // Health check endpoint

app.use('/api/auth', authRouter);
app.use('/api/projects', projectRouter);
app.use('/api/metrics', metricRouter);

// Catch-all for undefined routes
app.use((req, res, next) => {
  next(new AppError(`Not Found - ${req.originalUrl}`, 404));
});

// Centralized Error Handling
app.use(errorHandler);

export default app;