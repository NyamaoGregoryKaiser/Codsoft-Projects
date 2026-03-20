const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // For basic security headers
const config = require('@config');
const { globalRateLimiter } = require('@middleware/rateLimitMiddleware');
const loggingMiddleware = require('@middleware/loggingMiddleware');
const errorHandler = require('@middleware/errorHandler');
const apiRoutes = require('@routes'); // Central router
const { runAllCollectors } = require('@services/dbCollectorService');
const { scheduleJob } = require('@utils/scheduler');
const logger = require('@utils/logger');
const prisma = require('@config/db'); // Import prisma for initial DB instance check

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: config.env === 'development' ? '*' : 'http://localhost:3000', // Adjust for production frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom logging middleware
app.use(loggingMiddleware);

// Apply global rate limiting
app.use(globalRateLimiter);

// API routes
app.use('/api', apiRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl} - Route Not Found` });
});

// Centralized error handler
app.use(errorHandler);

// Schedule background tasks
const startScheduledJobs = async () => {
  try {
    const dbInstanceCount = await prisma.dbInstance.count();
    if (dbInstanceCount === 0) {
      logger.warn('No database instances found. Scheduled collectors will not run until instances are configured.');
      return;
    }
    // Run collectors on startup once
    await runAllCollectors();
    // Then schedule to run periodically
    scheduleJob(config.collectorScheduleCron, runAllCollectors, 'DB Data Collector');
  } catch (error) {
    logger.error('Failed to initialize scheduled jobs:', error);
  }
};

startScheduledJobs();

module.exports = app;