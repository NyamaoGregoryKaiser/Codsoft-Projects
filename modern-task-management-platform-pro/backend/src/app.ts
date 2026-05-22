```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import xss from 'xss-clean';
import compression from 'compression';
import cookieParser from 'cookie-parser';

// Import config and utilities
import { config } from './config/config';
import { AppError, NotFoundError } from './utils/errors';
import ApiResponse from './utils/apiResponse';

// Import middleware
import errorHandler from './middleware/error.middleware';
import morganMiddleware from './middleware/logging.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes from './modules/tasks/task.routes';
import commentRoutes from './modules/comments/comment.routes';

const app: Application = express();

// Set security HTTP headers
app.use(helmet());

// Logging middleware
app.use(morganMiddleware);

// Enable CORS
app.use(cors({
  origin: config.frontendUrl, // Allow only your frontend to access
  credentials: true,          // Allow cookies to be sent
}));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // Parse cookies

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['status', 'priority', 'dueDate', 'createdAt', 'updatedAt', 'orderBy', 'orderDirection', 'limit', 'page'],
}));

// Compress all responses
app.use(compression());

// Apply global rate limiting
app.use(apiRateLimiter);

// === API Routes ===
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/projects/:projectId/tasks', taskRoutes); // Nested tasks route
app.use('/api/v1/tasks/:taskId/comments', commentRoutes); // Nested comments route for a specific task

// === Health Check ===
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json(ApiResponse.success({ status: 'UP', timestamp: new Date() }, 'Service is healthy'));
});

// === Handle Unhandled Routes ===
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// === Global Error Handling Middleware ===
app.use(errorHandler);

export default app;
```