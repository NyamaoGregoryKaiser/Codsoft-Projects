```javascript
/**
 * @file Manages environment variables for the backend application.
 * @module config/index
 */

require('dotenv').config();

const config = {
    // Application settings
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

    // Database settings
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'chat_app_db',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        dialect: 'postgres',
        logging: process.env.DB_LOGGING === 'true' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    },

    // JWT settings
    jwt: {
        secret: process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbechangedinproduction',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d', // 1 day
    },

    // Redis settings
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '', // Optional password
    },

    // Rate Limiting settings
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
    },

    // Logging settings
    logLevel: process.env.LOG_LEVEL || 'info', // 'info', 'warn', 'error', 'debug'
};

// Validate essential configurations (example)
if (!config.jwt.secret) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}

if (config.env === 'production' && (!config.database.host || !config.database.password)) {
    console.warn('WARNING: Database credentials might be insecure or missing for production.');
}

module.exports = config;
```