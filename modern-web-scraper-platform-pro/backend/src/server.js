```javascript
// backend/src/server.js
require('dotenv').config();
const app = require('./app');
const db = require('./models');
const logger = require('./services/logger.service');
const cron = require('node-cron');
const jobService = require('./services/job.service');

const PORT = process.env.PORT || 5000;

// Connect to DB and start server
db.sequelize.sync().then(() => {
  logger.info('Database synced successfully.');

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    
    // Initialize scheduled jobs on startup
    jobService.initializeScheduledJobs();
  });
}).catch(error => {
  logger.error('Failed to sync database:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    logger.info('HTTP server closed');
    db.sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  // process.exit(1); // Consider exiting for critical unhandled rejections
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Application specific logging, throwing an error, or other logic here
  // process.exit(1); // Consider exiting for critical uncaught exceptions
});
```