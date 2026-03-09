```javascript
require('dotenv').config({ path: '.env' });
const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const schedulerService = require('./services/schedulerService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Apply migrations
    // In a production environment, you might use `npx sequelize-cli db:migrate` directly
    // or integrate it into your CI/CD pipeline. For simplicity here, we'll try to run it.
    // Note: this is for development convenience. For robust production deployments,
    // migrations should be run as a separate step.
    if (process.env.NODE_ENV !== 'test') {
      logger.info('Running database migrations...');
      // This is a programmatic way to run migrations, useful for testing or simple setups.
      // For more complex scenarios, `sequelize-cli` is usually preferred.
      await sequelize.sync({ alter: true }); // Use { alter: true } for development, { force: true } for full reset
      logger.info('Database migrations completed.');
    }

    // Initialize and start the scheduler for scraping jobs
    schedulerService.initScheduler();
    logger.info('Scraping job scheduler initialized.');

    // Start the Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

  } catch (error) {
    logger.error(`Unable to connect to the database or start server: ${error.message}`);
    process.exit(1); // Exit with a failure code
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, err);
  // Close server & exit process
  // server.close(() => process.exit(1)); // If you have a server instance to close
  process.exit(1);
});
```