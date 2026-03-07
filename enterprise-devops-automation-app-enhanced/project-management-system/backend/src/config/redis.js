```javascript
const redis = require('redis');
const config = require('./index');
const logger = require('./logger');

const redisClient = redis.createClient({
  url: `redis://${config.redis.password ? `:${config.redis.password}@` : ''}${config.redis.host}:${config.redis.port}`,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Redis Client Connected'));
redisClient.on('reconnecting', () => logger.warn('Redis Client Reconnecting'));
redisClient.on('end', () => logger.info('Redis Client Disconnected'));

module.exports = redisClient;
```