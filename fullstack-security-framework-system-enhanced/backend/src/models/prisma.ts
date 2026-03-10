import { PrismaClient } from '@prisma/client';
import { logger } from '@utils/logger';

// Instantiate PrismaClient
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Optional: Log Prisma events using Winston logger
prisma.$on('query', (e) => {
  logger.debug(`Prisma Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
});

prisma.$on('error', (e) => {
  logger.error(`Prisma Error: ${e.message} | Target: ${e.target}`);
});

prisma.$on('info', (e) => {
  logger.info(`Prisma Info: ${e.message} | Target: ${e.target}`);
});

prisma.$on('warn', (e) => {
  logger.warn(`Prisma Warn: ${e.message} | Target: ${e.target}`);
});