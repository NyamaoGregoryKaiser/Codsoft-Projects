require('./config/env'); // Load environment variables first
const app = require('./app');
const sequelize = require('./config/config').sequelize;
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection and run migrations
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Apply migrations
    await sequelize.sync({ alter: true }); // Use { alter: true } for development, { force: true } for testing, or sequelize-cli db:migrate for production
    logger.info('Database synchronized (migrations applied or schema updated).');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error(`Unable to connect to the database or start server: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
}

startServer();