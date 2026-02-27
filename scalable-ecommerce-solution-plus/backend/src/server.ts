import app from './app';
import config from './config';
import logger from './config/logger';
import prisma from './models/prisma';

const startServer = async () => {
    try {
        // Connect to the database
        await prisma.$connect();
        logger.info('Connected to PostgreSQL database.');

        // Start the Express server
        const server = app.listen(config.port, () => {
            logger.info(`Server is running on port ${config.port} in ${config.env} mode.`);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            // Close server & exit process
            server.close(() => {
                process.exit(1);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            // Close server & exit process
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();