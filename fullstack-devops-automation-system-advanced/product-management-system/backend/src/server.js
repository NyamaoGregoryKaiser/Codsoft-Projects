const app = require('./app');
const config = require('./config');
const sequelize = require('./models').sequelize;
const logger = require('./utils/logger');

// Synchronize database and start server
sequelize.sync()
  .then(() => {
    logger.info('Database connected and synchronized!');
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode.`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});
```

```