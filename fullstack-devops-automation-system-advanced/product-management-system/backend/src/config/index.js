require('dotenv').config();

// Define environment variables and their default values
// Environment variables are loaded from .env file (if present)
// This file centralizes configuration for the entire backend application.
module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationDays: process.env.JWT_EXPIRATION_DAYS || '7d' // e.g., '1h', '7d', '30m'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'productuser',
    password: process.env.DB_PASSWORD || 'productpassword',
    name: process.env.DB_NAME || 'productdb'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    cacheTTLSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10) // 5 minutes default
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10) // max 100 requests per window
  }
};
```

```