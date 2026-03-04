const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV', 'PORT', 'DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN',
  'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD', 'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQUESTS', 'LOG_LEVEL'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`WARNING: Environment variable "${envVar}" is not set.`);
    if (process.env.NODE_ENV === 'production' && ['DATABASE_URL', 'JWT_SECRET'].includes(envVar)) {
        throw new Error(`Critical environment variable "${envVar}" is missing in production mode.`);
    }
  }
});

// Set default values if not provided
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5000';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'info';

module.exports = process.env;