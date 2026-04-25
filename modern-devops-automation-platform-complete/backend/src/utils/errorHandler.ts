```typescript
// Re-export custom error types from the middleware file to be used throughout the application
// This helps centralize error definitions
export { AppError, NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError } from '../middlewares/errorHandler';
```