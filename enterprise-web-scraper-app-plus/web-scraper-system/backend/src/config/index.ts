```typescript
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables based on NODE_ENV
const envPath = path.resolve(__dirname, '../../.env'); // Adjust path as necessary
dotenv.config({ path: envPath });

const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwt: {
    secret: process.env.JWT_SECRET!,
    expirationTime: process.env.JWT_EXPIRATION_TIME || '1h',
  },
  admin: {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
  }
};

// Validate essential environment variables
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables.');
}
if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is not defined in environment variables.');
}
if (!config.admin.email || !config.admin.password) {
  console.warn('ADMIN_EMAIL or ADMIN_PASSWORD not fully defined. Seed script might fail or use defaults.');
}

export default config;
```