import 'reflect-metadata'; // Must be imported before TypeORM
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorMiddleware } from './middlewares/error.middleware';
import { requestLogger } from './middlewares/logger.middleware';
import { apiRateLimiter } from './middlewares/rateLimit.middleware';
import { authMiddleware } from './middlewares/auth.middleware'; // Import authMiddleware for protected routes

// Import routers
import { authRouter } from './modules/auth/auth.controller';
import { userRouter } from './modules/users/user.controller';
import { roleRouter } from './modules/roles/role.controller';
import { categoryRouter } from './modules/categories/category.controller';
import { tagRouter } from './modules/tags/tag.controller';
import { contentRouter } from './modules/content/content.controller';


const app = express();

// Security Middlewares
app.use(helmet()); // Set security-related HTTP headers
app.use(cors({ origin: config.app.frontendUrl })); // Enable CORS for the frontend
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Request Logger
app.use(requestLogger);

// Global API Rate Limiter (can be more specific per route)
app.use(apiRateLimiter);

// Public Routes
app.get('/api/health', (req, res) => res.status(200).send('API is healthy!'));
app.use('/api/auth', authRouter); // Login and Refresh token

// Authenticated Routes (apply authMiddleware)
// Note: Some endpoints within these controllers might have additional `authorize` middleware
app.use('/api/users', authMiddleware, userRouter);
app.use('/api/roles', authMiddleware, roleRouter);
app.use('/api/categories', authMiddleware, categoryRouter); // Public access to GET /categories is handled in controller
app.use('/api/tags', authMiddleware, tagRouter); // Public access to GET /tags is handled in controller
app.use('/api/content', contentRouter); // Content controller handles auth internally for admin/public access

// Fallback for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Centralized Error Handling Middleware
app.use(errorMiddleware);

export default app;