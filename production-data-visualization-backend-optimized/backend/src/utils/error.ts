```typescript
export class APIError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: string[];
  originalError?: Error; // Store original error for debugging/logging

  constructor(message: string, statusCode: number = 500, originalError?: Error, errors?: string[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates errors due to operational issues (e.g., invalid input, network)
    this.errors = errors;
    this.originalError = originalError;

    // Capture stack trace, excluding constructor call
    Error.captureStackTrace(this, this.constructor);
  }
}
```