```javascript
const dotenv = require('dotenv');
const path = require('path');

// Load .env variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(__dirname, `../../${envFile}`) });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL,
  testDatabaseUrl: process.env.TEST_DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000', // Frontend URL
  mockPaymentGatewayUrl: process.env.MOCK_PAYMENT_GATEWAY_URL || 'http://localhost:5001/mock-payment',
  mockPaymentGatewayApiKey: process.env.MOCK_PAYMENT_GATEWAY_API_KEY,
  cacheDurationSeconds: parseInt(process.env.CACHE_DURATION_SECONDS || '300', 10), // 5 minutes
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests
  logLevel: process.env.LOG_LEVEL || 'info', // Winston log level
};

// Validate essential configurations
const requiredConfig = ['jwtSecret', 'databaseUrl'];
for (const key of requiredConfig) {
  if (!config[key] && config.env !== 'test') { // Allow test environment to run without full DB setup if testing mocks
    throw new Error(`Missing required configuration variable: ${key}`);
  }
}

module.exports = config;
```

#### Frontend: React