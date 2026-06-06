```javascript
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const config = require('../config');

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

// Connect to the database
async function connectDb() {
  try {
    await prisma.$connect();
    logger.info('Prisma connected to database successfully.');
  } catch (error) {
    logger.error('Prisma failed to connect to database:', error);
    process.exit(1);
  }
}

// Disconnect from the database
async function disconnectDb() {
  await prisma.$disconnect();
  logger.info('Prisma disconnected from database.');
}

// Ensure connection when module is imported
// This is typically handled in `server.js` for graceful shutdown,
// but can be added here for standalone scripts.
// connectDb(); // Removed here as server.js manages it

module.exports = prisma;
```