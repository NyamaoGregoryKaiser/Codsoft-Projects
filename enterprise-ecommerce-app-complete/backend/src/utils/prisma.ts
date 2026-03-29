```typescript
import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

// Optional: Log Prisma warnings/errors using Winston
prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning:', e.message);
});

prisma.$on('error', (e) => {
  logger.error('Prisma Error:', e.message);
});

export default prisma;
```