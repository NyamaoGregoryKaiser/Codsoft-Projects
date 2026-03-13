```typescript
import 'reflect-metadata'; // Must be imported before TypeORM
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import logger from './shared/logger';
import { notFoundHandler, errorHandler } from './shared/error-handler';
import { connectRedis } from './shared/redis-client';

// Import Routes
import authRoutes from './auth/auth.routes';
import userRoutes from './users/user.routes';
import dbConnectionRoutes from './database-connections/database-connection.routes';
import dbMonitorRoutes from './database-monitor/database-monitor.routes';

const app = express();

// --- Global Middleware ---
app.use(helmet()); // Security headers
app.use(cors({ origin: config.isDevelopment ? '*' : 'http://localhost:3000' })); // Configure CORS appropriately for production
app.use(bodyParser.json()); // Parse JSON request bodies

// Rate limiting to prevent abuse
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again after some time.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(apiLimiter);

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', dbConnectionRoutes);
app.use('/api/monitor', dbMonitorRoutes);

// --- Error Handling Middleware ---
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```