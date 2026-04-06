const { Worker, Job } = require('bullmq');
const config = require('../config');
const MonitoringService = require('../services/monitoring.service');
const logger = require('../config/logger');
const DbConnection = require('../models/dbConnection.model');

const connection = {
    host: config.redis.host,
    port: config.redis.port,
    // password: 'your-redis-password' // if Redis requires authentication
};

// Initialize worker for the 'dbMonitoring' queue
const dbMonitoringWorker = new Worker('dbMonitoring', async (job) => {
    const { dbConnectionId } = job.data;
    logger.info(`Processing monitoring job for DB Connection ID: ${dbConnectionId}`);
    await MonitoringService.monitorDatabase(dbConnectionId);
}, { connection });

dbMonitoringWorker.on('completed', (job) => {
    logger.info(`Monitoring job ${job.id} completed for DB Connection ID: ${job.data.dbConnectionId}`);
});

dbMonitoringWorker.on('failed', (job, err) => {
    logger.error(`Monitoring job ${job.id} failed for DB Connection ID: ${job.data.dbConnectionId} - ${err.message}`);
});

dbMonitoringWorker.on('error', (err) => {
    logger.error(`Monitoring Worker Error: ${err}`);
});

logger.info('BullMQ DB Monitoring Worker started.');

// On startup, re-add any active monitoring jobs to the queue
const setupActiveMonitoringJobs = async () => {
    logger.info('Setting up active monitoring jobs on worker startup...');
    try {
        const activeConnections = await DbConnection.findMonitoringActive();
        for (const conn of activeConnections) {
            const jobName = `monitorDb-${conn.id}`;
            await monitoringQueue.add(jobName, { dbConnectionId: conn.id }, {
                repeat: {
                    every: config.monitoring.intervalMs,
                    key: jobName
                },
                jobId: jobName, // Use jobId to prevent duplicates if worker restarts
            });
            logger.info(`Re-added active monitoring job for DB Connection ID: ${conn.id}`);
        }
    } catch (error) {
        logger.error('Error setting up active monitoring jobs:', error.message);
    }
};

// Call this function when the worker starts (e.g., in server.js or a separate worker script)
// It's called in server.js to ensure it runs with the main application.
const { monitoringQueue } = require('./queue'); // Import after queue is initialized

module.exports = {
    dbMonitoringWorker,
    setupActiveMonitoringJobs
};