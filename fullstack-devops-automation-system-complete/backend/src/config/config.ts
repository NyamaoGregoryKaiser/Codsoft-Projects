```typescript
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the root of the project
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://myuser:mypassword@localhost:5432/product_catalog_db',
  jwtSecret: process.env.JWT_SECRET || 'supersecretjwtkey',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  logLevel: process.env.LOG_LEVEL || 'info',
  cacheTtl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL, 10) : 3600, // seconds
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173', // For CORS
};

// Validate essential configurations
if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables.');
}

export default config;
```