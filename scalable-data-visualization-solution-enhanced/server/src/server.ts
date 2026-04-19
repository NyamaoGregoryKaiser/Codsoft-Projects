```typescript
import app from './app';
import { config } from './config/config';
import { initializeDatabase } from './config/db';
import { logger } from './utils/logger';

const startServer = async () => {
  await initializeDatabase();

  const PORT = config.PORT;
  app.listen(PORT, () => {
    logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
```