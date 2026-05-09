import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';

import config from './config/env';
import logger from './config/logger';
import { ApiError } from './middleware/error.middleware';
import errorHandler from './middleware/error.middleware';
import { setupSwagger } from './config/swagger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import productRoutes from './modules/products/product.routes';
import orderRoutes from './modules/orders/order.routes';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());
app.options('*', cors()); // Enable pre-flight across all routes

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Prevent HTTP parameter pollution
app.use(hpp());

// Gzip compression
app.use(compression());

// Request logging (development only)
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Swagger API documentation
setupSwagger(app);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  next(new ApiError(StatusCodes.NOT_FOUND, ReasonPhrases.NOT_FOUND));
});

// Global error handler
app.use(errorHandler);

export default app;