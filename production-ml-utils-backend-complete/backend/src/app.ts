```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/appError';
import { config } from './config';
import routes from './routes';
import { logger } from './utils/logger';

const app = express();

// Security Middleware
app.use(helmet());

// CORS - Allow cross-origin requests
app.use(cors({
  origin: config.isProduction ? 'https://your-production-frontend.com' : '*', // Adjust for production
  credentials: true,
}));

// Rate Limiting for all API requests
app.use(apiRateLimiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serving static files (for uploaded models/datasets - local storage)
// In production, this should be handled by a dedicated service like Nginx or cloud storage.
app.use('/uploads', express.static(config.storagePath));

// API Routes
app.use('/api/v1', routes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
```