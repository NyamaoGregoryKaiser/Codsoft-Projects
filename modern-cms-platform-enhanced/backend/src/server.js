```javascript
const app = require('./app');
const sequelize = require('./config/sequelize');
const config = require('./config/config');
const logger = require('./utils/logger');
const { User, ContentType } = require('./models'); // Import models to ensure they are loaded

let server;

const startServer = async () => {
  try {
    // Sync models and apply migrations (recommended for dev, use `db:migrate` for prod)
    // For production, ensure migrations are run separately
    if (config.env === 'development') {
      await sequelize.sync({ force: false }); // `force: true` drops tables
      logger.info('Database synchronized (no force).');
    } else {
      // In production, migrations should be run explicitly: `npm run db:migrate`
      logger.info('Database synchronization skipped for production. Run migrations manually.');
    }

    server = app.listen(config.port, () => {
      logger.info(`Listening to requests on http://localhost:${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to connect to DB or start server:', error);
    process.exit(1);
  }
};

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error('Unhandled error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

startServer();
```