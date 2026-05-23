import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors'; // Handles async errors in Express routes automatically
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import scrapeJobRoutes from './routes/scrapeJob.routes';
import scrapedDataRoutes from './routes/scrapedData.routes';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Request body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use(requestLogger);

// Rate Limiting
app.use('/api/', apiLimiter); // Apply to all API routes

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/scrape-jobs', scrapeJobRoutes);
app.use('/api/scraped-data', scrapedDataRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Web Scraper Backend is running' });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handler (must be last middleware)
app.use(errorHandler);

export default app;