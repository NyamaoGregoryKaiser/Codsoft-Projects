import NodeCache from 'node-cache';
import { CACHE_TTL } from '../config/config';
import logger from './logger';

// Create a new cache instance with a standard TTL (Time To Live)
const cache = new NodeCache({ stdTTL: CACHE_TTL, checkperiod: 120 });

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