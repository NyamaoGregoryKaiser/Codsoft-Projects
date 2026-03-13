```typescript
import NodeCache from 'node-cache';
import config from '../config/config';
import logger from './logger';

const cache = new NodeCache({ stdTTL: config.cacheTtl, checkperiod: 120 }); // Default TTL from config, check every 120s

cache.on('set', (key, value) => {
  logger.debug(`Cache set: ${key}`);
});

cache.on('del', (key) => {
  logger.debug(`Cache deleted: ${key}`);
});

cache.on('expired', (key, value) => {
  logger.debug(`Cache expired: ${key}`);
});

export default cache;
```