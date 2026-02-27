import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

let prisma: PrismaClient;

// Use globalThis to prevent multiple instances of PrismaClient in development
// (e.g., due to hot-reloading)
if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
        log: [
            { level: 'warn', emit: 'event' },
            { level: 'error', emit: 'event' },
        ],
    });
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            log: [
                { level: 'query', emit: 'event' }, // Log all database queries in dev
                { level: 'warn', emit: 'event' },
                { level: 'error', emit: 'event' },
            ],
        });
    }
    prisma = global.prisma;
}

// Log Prisma events
prisma.$on('query', (e) => {
    logger.debug(`Prisma Query: ${e.query} Params: ${e.params} Duration: ${e.duration}ms`);
});
prisma.$on('warn', (e) => {
    logger.warn(`Prisma Warn: ${e.message}`);
});
prisma.$on('error', (e) => {
    logger.error(`Prisma Error: ${e.message}`);
});

export default prisma;