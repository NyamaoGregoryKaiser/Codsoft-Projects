```typescript
import { User } from '../database/entities/user.entity';

// Extend the Express Request type to include the 'user' property
declare global {
  namespace Express {
    interface Request {
      user?: User; // Optional user object attached by auth middleware
      cacheKey?: string; // Optional cache key attached by cache middleware
    }
  }
}
```