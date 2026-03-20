require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  cacheTTL: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10), // 1 hour
  collectorScheduleCron: process.env.COLLECTOR_SCHEDULE_CRON || '0 */1 * * *', // Every hour
  slowQueryThresholdMs: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '500', 10), // 500ms
};