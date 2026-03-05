const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./utils/logger');
const config = require('./config/config');

const PORT = config.port;

// Connect to database and start server
sequelize.authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.');
    return sequelize.sync(); // You might want to use migrations in production
  })
  .then(() => {
    logger.info('Database synchronized (models created/updated).');
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.env} mode.`);
    });
  })
  .catch(err => {
    logger.error('Unable to connect to the database:', err);
    process.exit(1); // Exit process if database connection fails
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
  logger.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});