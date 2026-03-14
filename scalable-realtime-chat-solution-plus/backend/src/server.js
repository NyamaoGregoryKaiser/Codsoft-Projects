```javascript
/**
 * @file Main entry point for the backend server.
 * Connects to the database and starts the Express and Socket.IO servers.
 * @module server
 */

const http = require('http');
const app = require('./app');
const config = require('./config');
const { connectDB } = require('./config/database');
const { syncModels } = require('./models');
const { initSocket } = require('./socket');
const logger = require('./utils/logger');
const { connectRedis } = require('./config/redis');

// Create HTTP server
const server = http.createServer(app);

/**
 * Starts the application: connects to DB, syncs models, connects to Redis, initializes Socket.IO, and starts HTTP server.
 * @async
 * @function startServer
 * @returns {Promise<void>}
 */
const startServer = async () => {
    try {
        // 1. Connect to PostgreSQL Database
        await connectDB();
        // 2. Sync Sequelize Models (create tables if they don't exist)
        // Set force to `true` ONLY in development for testing, it will drop and recreate tables.
        // In production, use migrations!
        await syncModels(false); // Do not force sync in production
        // 3. Connect to Redis
        await connectRedis();
        // 4. Initialize Socket.IO
        initSocket(server, app);

        // 5. Start HTTP server
        server.listen(config.port, () => {
            logger.info(`Server running on port ${config.port} in ${config.env} mode.`);
            logger.info(`Access API at ${config.serverUrl}`);
            logger.info(`Frontend expected at ${config.clientUrl}`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    logger.error(`Unhandled Rejection: ${err.message}`, err);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Start the server
startServer();
```