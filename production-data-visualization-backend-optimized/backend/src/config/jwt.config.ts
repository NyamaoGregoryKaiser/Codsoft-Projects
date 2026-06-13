```typescript
import dotenv from 'dotenv';
dotenv.config();

export const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
```