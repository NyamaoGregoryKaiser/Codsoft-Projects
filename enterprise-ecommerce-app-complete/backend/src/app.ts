```typescript
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/errorHandler';
import logger from './utils/logger';
import { rateLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import orderRoutes from './routes/orderRoutes';
import cartRoutes from './routes/cartRoutes';
import reviewRoutes from './routes/reviewRoutes';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'production' ? ['https://your-frontend-domain.com'] : '*', // Adjust for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

// Request Logger (Morgan)
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Custom tiny format for production to avoid sensitive data in logs
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate Limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'E-commerce API is running!',
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes
app.use(`${config.API_PREFIX}/auth`, authRoutes);
app.use(`${config.API_PREFIX}/users`, userRoutes);
app.use(`${config.API_PREFIX}/products`, productRoutes);
app.use(`${config.API_PREFIX}/categories`, categoryRoutes);
app.use(`${config.API_PREFIX}/orders`, orderRoutes);
app.use(`${config.API_PREFIX}/cart`, cartRoutes);
app.use(`${config.API_PREFIX}/reviews`, reviewRoutes);


// Handle undefined routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(errorHandler);

export { app };
```