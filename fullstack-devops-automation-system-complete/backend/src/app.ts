```typescript
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/config';
import apiRoutes from './routes';
import errorHandler from './middleware/error-handler';
import requestLogger from './middleware/request-logger';
import { rateLimiter } from './middleware/rate-limiter';
import { CustomError } from './utils/errors';
import logger from './utils/logger';

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: config.frontendUrl, // Allow requests from frontend URL
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request Logger
app.use(requestLogger);

// Rate Limiting
app.use(rateLimiter);

// API Routes
app.use('/api', apiRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  next(new CustomError('Route not found', 404));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
```