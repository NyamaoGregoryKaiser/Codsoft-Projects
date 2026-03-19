import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import { API_PREFIX } from './config/config';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { requestLoggerMiddleware } from './middleware/loggerMiddleware';
import { apiRateLimiter } from './middleware/rateLimitMiddleware';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import taskRoutes from './modules/tasks/task.routes';

const app = express();

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);
app.use(apiRateLimiter); // Apply rate limiting to all API routes

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Welcome to the Mobile App Backend API! Access API docs at /api-docs');
});

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;