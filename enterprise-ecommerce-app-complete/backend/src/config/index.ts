```typescript
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REDIS_URL: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ecommerce_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkeyfallback',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};

// Validate critical configurations
if (!config.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}
if (!config.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
if (!config.REDIS_URL) {
  throw new Error('REDIS_URL is not defined in environment variables');
}

export { config };
```