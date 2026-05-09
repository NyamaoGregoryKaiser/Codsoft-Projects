import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRATION_MINUTES: number;
  JWT_REFRESH_EXPIRATION_DAYS: number;
  REDIS_URL: string;
  CACHE_TTL_SECONDS: number;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
}

const config: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey',
  JWT_ACCESS_EXPIRATION_MINUTES: parseInt(process.env.JWT_ACCESS_EXPIRATION_MINUTES || '30', 10),
  JWT_REFRESH_EXPIRATION_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7', 10),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10), // 1 hour
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per minute
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// Validate required environment variables for production
if (config.NODE_ENV === 'production') {
  const requiredEnv = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REDIS_URL',
  ];
  requiredEnv.forEach((key) => {
    if (!process.env[key]) {
      console.error(`Error: Missing required environment variable ${key} in production environment.`);
      process.exit(1);
    }
  });
}

export default config;