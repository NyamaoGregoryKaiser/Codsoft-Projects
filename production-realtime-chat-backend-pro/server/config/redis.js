```javascript
const redis = require('redis');
const logger = require('./winston');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  password: process.env.REDIS_PASSWORD || undefined, // Only include if password is set
  legacyMode: true // Recommended for older Redis versions or specific libraries
});

client.on('connect', () => logger.info('Redis Client Connected'));
client.on('error', (err) => logger.error('Redis Client Error', err));

// Connect to Redis when the module is imported
(async () => {
  try {
    await client.connect();
  } catch (err) {
    logger.error('Failed to connect to Redis', err);
  }
})();

module.exports = client;
```