```typescript
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_USERNAME: process.env.DB_USERNAME || "user",
  DB_PASSWORD: process.env.DB_PASSWORD || "password",
  DB_NAME: process.env.DB_NAME || "payment_db",

  JWT_SECRET: process.env.JWT_SECRET || "supersecretjwtkey",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10), // 100 requests

  MOCK_PAYMENT_GATEWAY_API_URL: process.env.MOCK_PAYMENT_GATEWAY_API_URL || "http://mock-gateway.com/api",
  MOCK_PAYMENT_GATEWAY_API_KEY: process.env.MOCK_PAYMENT_GATEWAY_API_KEY || "mock-api-key-123",

  WEBHOOK_MAX_RETRIES: parseInt(process.env.WEBHOOK_MAX_RETRIES || "5", 10),
  WEBHOOK_RETRY_DELAY_MS: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || "60000", 10),
};

// Validate essential configurations
if (!config.JWT_SECRET || config.JWT_SECRET === "supersecretjwtkey") {
  logger.warn("JWT_SECRET is not set or using default. Please change it in production.");
}

export default config;
```