const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const { notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? 'https://your-frontend-domain.com' : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Rate Limiting
app.use(rateLimitMiddleware);

// Request body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log all requests (optional, for debugging)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Catch 404 and forward to error handler
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

module.exports = app;