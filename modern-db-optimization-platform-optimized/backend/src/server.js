const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
require('./db'); // Ensure database connection is initialized
const { setupActiveMonitoringJobs } = require('./jobs/worker'); // Ensure worker is started and jobs are setup

const startServer = async () => {
    try {
        await setupActiveMonitoringJobs(); // Re-add active monitoring jobs on startup

        app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port} in ${config.env} mode.`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application might be in an unstable state, consider graceful shutdown
    // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Critical error, immediately terminate
    process.exit(1);
});