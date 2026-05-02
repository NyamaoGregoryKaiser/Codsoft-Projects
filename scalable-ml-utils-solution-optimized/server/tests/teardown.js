const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../src/utils/logger'); // Use server's logger
const fs = require('fs/promises'); // For file system operations

module.exports = async () => {
  logger.info('Global test teardown: Disconnecting Prisma and cleaning up...');
  try {
    await prisma.$disconnect();

    // Clean up test upload directory
    if (process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.endsWith('-test')) { // Safety check
      await fs.rm(process.env.UPLOAD_DIR, { recursive: true, force: true });
      logger.info(`Cleaned up test upload directory: ${process.env.UPLOAD_DIR}`);
    }
  } catch (error) {
    logger.error('Error during test teardown:', error);
  }
};