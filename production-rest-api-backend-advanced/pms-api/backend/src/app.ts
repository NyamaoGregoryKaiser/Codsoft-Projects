import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './docs/swagger.json'; // Adjust path if using generated spec
import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/logger';
import { rateLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes from './modules/tasks/task.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Custom Logger Middleware
app.use(loggerMiddleware);

// Rate limiting
app.use(rateLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Register API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Catch-all for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

export default app;