```javascript
require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
const logger = require('./utils/logger');
const redisClient = require('./utils/cache').client;

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');

        // Sync models (only in development/testing, migrations for production)
        // await sequelize.sync({ force: false }); 
        // logger.info('Database models synced.');

        // Connect to Redis
        await redisClient.connect();
        logger.info('Redis client connected successfully.');
        
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });

    } catch (error) {
        logger.error('Unable to connect to the database or start server:', error);
        process.exit(1); // Exit process with failure
    }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    if (redisClient.isOpen) {
        await redisClient.quit();
        logger.info('Redis client disconnected.');
    }
    await sequelize.close();
    logger.info('Database connection closed.');
    process.exit(0);
});
```