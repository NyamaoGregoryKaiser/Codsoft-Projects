```javascript
const { createClient } = require('redis');
const config = require('./config');
const logger = require('./logger');

const redisClient = createClient({
  password: config.redis.password,
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis client error:', err));

const connectRedis = async () => {
  if (!redisClient.isReady) {
    await redisClient.connect();
  }
};

module.exports = {
  redisClient,
  connectRedis,
};
```