```javascript
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const logger = require('../middlewares/logger');

let prisma;

if (config.env === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, we want to re-use the same PrismaClient instance
  // across hot reloads to avoid exhausting the database connection pool.
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'], // Log database queries in dev
    });
  }
  prisma = global.prisma;
}

prisma.$on('query', (e) => {
  logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
});

module.exports = prisma;
```