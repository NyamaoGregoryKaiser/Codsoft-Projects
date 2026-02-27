import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ecommerce_db',
    jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    cacheTTL: parseInt(process.env.CACHE_TTL || '3600', 10), // Cache Time To Live in seconds (1 hour)
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Max requests per window
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // Window in ms (1 minute)
};

// Validate essential configurations
if (!config.jwtSecret || config.jwtSecret.length < 32) {
    console.error('CRITICAL ERROR: JWT_SECRET is not set or too short. Please set a strong secret in .env');
    process.exit(1);
}
if (!config.databaseUrl) {
    console.error('CRITICAL ERROR: DATABASE_URL is not set in .env');
    process.exit(1);
}

export default config;