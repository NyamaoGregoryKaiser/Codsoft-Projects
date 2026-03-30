```typescript
import { Request, Response, NextFunction } from "express";

// Higher-order function to wrap async route handlers
// This ensures that any errors thrown in async operations are caught and passed to Express's error middleware.
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```