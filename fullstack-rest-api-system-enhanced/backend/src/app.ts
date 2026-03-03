import 'reflect-metadata'; // Must be imported before TypeORM or class-validator usage
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import Middleware
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/log.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';

// Import Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import taskRoutes from './modules/tasks/tasks.routes';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Request Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Request Logger
app.use(requestLogger);

// Rate Limiting (apply to all requests or specific routes)
app.use(apiRateLimiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('API is healthy!');
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Centralized Error Handling Middleware (must be last)
app.use(errorHandler);

export default app;