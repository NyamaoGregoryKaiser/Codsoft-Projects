const { createClient } = require('redis');
const { REDIS_URL } = require('../config');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

module.exports = redisClient;