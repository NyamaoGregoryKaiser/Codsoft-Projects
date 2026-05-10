import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Middleware to log queries, useful for development/debugging
// prismaClient.$use(async (params, next) => {
//   const before = Date.now();
//   const result = await next(params);
//   const after = Date.now();
//   logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
//   return result;
// });

export const prisma = prismaClient;