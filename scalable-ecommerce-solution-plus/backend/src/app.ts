import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import productRoutes from './routes/product.routes';
import authRoutes from './routes/auth.routes';
import errorHandler from './middlewares/errorHandler';
import apiLimiter from './middlewares/rateLimit.middleware';
import loggerMiddleware from './middlewares/logger.middleware';
import logger from './config/logger';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow requests from frontend
    credentials: true,
}));

// Request Logger
app.use(loggerMiddleware);

// Rate Limiting
app.use('/api/', apiLimiter); // Apply to all API routes

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
// app.use('/api/users', userRoutes); // Would be implemented
// app.use('/api/orders', orderRoutes); // Would be implemented
// app.use('/api/cart', cartRoutes); // Would be implemented

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'E-commerce API is running!' });
});

// Catch-all for undefined routes
app.use((req, res, next) => {
    logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: 'Not Found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;