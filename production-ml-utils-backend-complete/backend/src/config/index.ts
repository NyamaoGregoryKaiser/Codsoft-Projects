```typescript
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ml_utilities_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretjwtkey',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
  storagePath: process.env.STORAGE_PATH || path.resolve(__dirname, '../../uploads'),
  isProduction: process.env.NODE_ENV === 'production',
};
```