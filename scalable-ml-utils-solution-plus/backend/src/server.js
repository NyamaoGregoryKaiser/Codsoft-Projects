```javascript
const app = require('./app');
const config = require('./config/config');
const db = require('./db');
const logger = require('./utils/logger');

// Database connection and synchronization
db.sequelize.authenticate()
  .then(() => {
    logger.info('DB Connection has been established successfully.');
    // In development/testing, you might want to sync models
    // In production, migrations are preferred
    if (config.env !== 'production') {
      logger.info('Synchronizing database models (non-production environment)...');
      return db.sequelize.sync({ alter: false }); // alter: true will modify tables, dangerous for production without careful handling
    }
  })
  .then(() => {
    logger.info('Database models synchronized (if applicable).');
    // Start the server only after successful DB connection
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode.`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
      server.close(() => {
        process.exit(1);
      });
    });

  })
  .catch(err => {
    logger.error('Unable to connect to the database or synchronize models:', err);
    process.exit(1); // Exit process if DB connection fails
  });
```