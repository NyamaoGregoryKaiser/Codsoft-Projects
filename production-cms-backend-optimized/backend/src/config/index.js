```javascript
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true',
  },

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION, // e.g., '1d'

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheDuration: parseInt(process.env.CACHE_DURATION_SECONDS, 10) || 3600, // Default 1 hour

  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate essential configurations
if (!config.jwtSecret) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}
if (!config.db.host || !config.db.database || !config.db.user || !config.db.password) {
  if (config.env !== 'test') { // Allow missing DB config for test if mocking DB
    throw new Error('FATAL ERROR: Database connection details are incomplete.');
  }
}

module.exports = config;
```