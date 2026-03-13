```typescript
/**
 * CustomError class for standardized API error responses.
 */
export class CustomError extends Error {
  statusCode: number;
  errors?: any[]; // Optional array for validation errors or more detailed issues

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.errors = errors;

    // This is important for properly extending built-in classes in TypeScript
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
```