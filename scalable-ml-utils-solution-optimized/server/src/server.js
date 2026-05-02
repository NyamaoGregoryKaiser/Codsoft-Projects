require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const app = require('./app');
const { PORT } = require('./config');
const logger = require('./utils/logger');
const prisma = require('./models/prisma');
const redisClient = require('./models/redis');

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');

    await redisClient.connect();
    logger.info('Connected to Redis cache');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to database or start server:', error);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing HTTP server');
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(0);
  });
}

startServer();