```javascript
require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'devops_db',
  DB_USER: process.env.DB_USER || 'devops_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'devops_password',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_please_change_this_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

// Ensure DB_HOST points to the service name when running in Docker Compose
if (config.NODE_ENV === 'development' && process.env.DOCKER_CONTAINER === 'true') {
  config.DB_HOST = 'db';
  config.REDIS_HOST = 'redis';
} else if (config.NODE_ENV === 'production' && process.env.DOCKER_CONTAINER === 'true') {
  // In a real production environment, these would be external IPs/hostnames
  // For this example, we'll keep them as service names if deployed via Docker Compose
  // In cloud, these would be managed service endpoints
  config.DB_HOST = process.env.PROD_DB_HOST || 'db'; // Example for cloud or external DB
  config.REDIS_HOST = process.env.PROD_REDIS_HOST || 'redis'; // Example for cloud or external Redis
}


module.exports = config;
```