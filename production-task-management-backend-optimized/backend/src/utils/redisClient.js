```javascript
const redis = require('redis');
const config = require('../config');
const logger = require('../middlewares/logger');

const redisOptions = {
  url: `redis://${config.redis.host}:${config.redis.port}`,
  password: config.redis.password,
};

const redisClient = redis.createClient(redisOptions);

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('ready', () => logger.info('Redis client ready to use'));
redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('end', () => logger.info('Redis client disconnected'));

// Connect immediately
(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
```