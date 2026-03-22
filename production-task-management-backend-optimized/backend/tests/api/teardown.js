```javascript
const prisma = require('../../src/db/prisma');
const redisClient = require('../../src/utils/redisClient');

module.exports = async () => {
  // Disconnect Prisma
  await prisma.$disconnect();
  // Disconnect Redis
  await redisClient.disconnect();
  // Optionally clear test database here if not done by migrations
  // For production-ready, you might want to truncate all tables after each test suite
  // However, `prisma migrate reset` or creating a fresh DB per test run is usually preferred.
};
```