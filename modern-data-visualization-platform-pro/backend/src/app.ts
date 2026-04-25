import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import bodyParser from 'body-parser';
import { API_PREFIX } from '@config/env';
import { errorHandler } from '@middleware/error-handler';
import { setupRoutes } from './routes';
import { rateLimiter } from '@middleware/rate-limiter';
import logger from '@config/logger';

const app = express();

// Security Middlewares
app.use(helmet()); // Set various HTTP headers for security
app.use(cors()); // Enable CORS for all origins (can be configured for specific origins)
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Body Parsers
app.use(bodyParser.json({ limit: '10mb' })); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' })); // for parsing application/x-www-form-urlencoded

// Rate Limiting (apply to all requests or specific routes)
app.use(rateLimiter);

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Data Viz System Backend is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Setup API Routes
// All routes will be prefixed with /api/v1
setupRoutes(app, API_PREFIX);
logger.info(`API routes mounted at prefix: ${API_PREFIX}`);

// Error Handling Middleware (must be last)
app.use(errorHandler);

export default app;