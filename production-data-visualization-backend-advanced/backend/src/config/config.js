require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey',
  jwtExpiration: process.env.JWT_EXPIRATION || '1d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  db: {
    name: process.env.DB_NAME || 'dataviz',
    user: process.env.DB_USER || 'datavizuser',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
  cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10), // 5 minutes
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
};

module.exports = config;