require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    database: {
        client: process.env.DB_CLIENT || 'pg',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'dbmonitor_user',
            password: process.env.DB_PASSWORD || 'dbmonitor_password',
            database: process.env.DB_NAME || 'dbmonitor_db',
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'supersecretjwtkey',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
    },
    monitoring: {
        intervalMs: parseInt(process.env.MONITORING_INTERVAL_MS || '300000', 10), // Default 5 minutes
    }
};

module.exports = config;