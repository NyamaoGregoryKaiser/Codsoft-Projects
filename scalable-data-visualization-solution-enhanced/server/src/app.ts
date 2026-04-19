```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import { config } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { apiRateLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes'; // Example admin routes for user management
import datasetRoutes from './routes/dataset.routes';
import visualizationRoutes from './routes/visualization.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app: Application = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: config.FRONTEND_URL, // Allow only your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request Logger (optional, you can use morgan or a custom one)
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Rate Limiting
app.use(apiRateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Admin routes for user management
app.use('/api/datasets', datasetRoutes);
app.use('/api/visualizations', visualizationRoutes);
app.use('/api/dashboards', dashboardRoutes);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', message: 'Data Visualization System API is running!' });
});

// Catch-all for undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as any;
  error.statusCode = 404;
  next(error);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
```