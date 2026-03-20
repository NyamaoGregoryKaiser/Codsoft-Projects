const { PrismaClient } = require('@prisma/client');
const logger = require('@utils/logger');

let prisma;

// Initialize Prisma client with a connection pool
// This ensures that only one instance of PrismaClient is created
// and reused across the application, managing database connections efficiently.
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, we use a global variable to prevent
  // multiple instances of PrismaClient being created during hot-reloading
  // which can lead to multiple database connections and performance issues.
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'], // Log all queries in dev
    });
  }
  prisma = global.prisma;
}

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
  return result;
});

module.exports = prisma;