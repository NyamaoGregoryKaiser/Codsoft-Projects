```typescript
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';

import { errorHandler } from './middlewares/errorHandler';
import { loggerMiddleware } from './middlewares/loggerMiddleware';
import { rateLimitMiddleware } from './middlewares/rateLimitMiddleware';
import { NotFoundError } from './utils/errorHandler';
import { logger } from './utils/logger';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : ['http://localhost:5001', 'http://localhost'], // Adjust as per your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request Logger
app.use(loggerMiddleware);

// Rate Limiting
app.use(rateLimitMiddleware);

// Body Parser
app.use(express.json());

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({ status: 'UP', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes); // Task routes that might be standalone or reference projects

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Resource not found: ${req.originalUrl}`));
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
```