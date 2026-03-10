import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import httpStatus from 'http-status';
import { morganMiddleware } from '@middleware/logger.middleware';
import { errorHandler } from '@middleware/error.middleware';
import { notFoundHandler } from '@middleware/notFound.middleware';
import { authRoutes } from '@routes/auth.route';
import { userRoutes } from '@routes/user.route';
import { productRoutes } from '@routes/product.route';
import { swaggerDocs, swaggerUi } from '@config/swagger';
import { env } from '@config/env';
import { AppError } from '@utils/appError';

const app: Application = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
const corsOptions = {
  origin: env.corsOrigins.split(',').map(o => o.trim()),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// Gzip compression
app.use(compression());

// HTTP request logger
app.use(morganMiddleware);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);

// Catch-all for undefined routes
app.use(notFoundHandler);

// Handle errors
app.use(errorHandler);

export default app;