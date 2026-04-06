const { Queue } = require('bullmq');
const config = require('../config');
const logger = require('../config/logger');

const connection = {
    host: config.redis.host,
    port: config.redis.port,
    // password: 'your-redis-password' // if Redis requires authentication
};

// Queue for monitoring database connections
const monitoringQueue = new Queue('dbMonitoring', { connection });

monitoringQueue.on('error', (error) => {
    logger.error('Monitoring Queue Error:', error);
});

monitoringQueue.on('completed', (job) => {
    logger.info(`Job ${job.id} completed for connection ${job.data.dbConnectionId}`);
});

monitoringQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed for connection ${job.data.dbConnectionId}: ${err.message}`);
});

logger.info('BullMQ monitoring queue initialized.');

module.exports = {
    monitoringQueue,
};