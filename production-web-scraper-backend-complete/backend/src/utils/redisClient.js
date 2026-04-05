const { createClient } = require('redis');
const { redis: redisConfig } = require('../config');
const logger = require('./logger');

let redisClient;

const connectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const client = createClient({
    url: `redis://${redisConfig.host}:${redisConfig.port}`,
    password: redisConfig.password,
  });

  client.on('error', (err) => logger.error('Redis Client Error', err));
  client.on('connect', () => logger.info('Redis Client Connected'));
  client.on('ready', () => logger.info('Redis Client Ready'));

  try {
    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    logger.error('Could not connect to Redis:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    logger.warn('Redis client not connected. Attempting to reconnect...');
    connectRedis().catch(err => logger.error('Failed to reconnect Redis:', err));
  }
  return redisClient;
};


module.exports = {
  connectRedis,
  getRedisClient,
};