```typescript
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { logger } from '../middleware/logger';

// Prevent multiple instances of PrismaClient in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

if (config.env !== 'production') {
  global.prisma = prisma;
}

prisma.$connect()
  .then(() => logger.info('Database connection established successfully.'))
  .catch((error) => logger.error('Database connection failed:', error));

export default prisma;
```