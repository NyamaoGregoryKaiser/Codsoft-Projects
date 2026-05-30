```javascript
require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/models').sequelize;
const logger = require('./src/config/logger.config');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection and apply migrations
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Apply migrations
    // In a production environment, you might run migrations as a separate step
    // using a dedicated migration container or CI/CD pipeline.
    // For simplicity in this example, we run it on server startup.
    // Ensure idempotency for concurrent server instances or restarts.
    await sequelize.sync({ alter: true }); // Use { alter: true } for schema changes
    logger.info('Database schema synchronized successfully (migrations applied).');

    // Start the Express server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database or start server:', error);
    process.exit(1); // Exit with failure code
  }
}

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection! Shutting down...', err);
  if (err.stack) {
    logger.error(err.stack);
  }
  process.exit(1); // Exit with failure code
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception! Shutting down...', err);
  if (err.stack) {
    logger.error(err.stack);
  }
  process.exit(1); // Exit with failure code
});
```