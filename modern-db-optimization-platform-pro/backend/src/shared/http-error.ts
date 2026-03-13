```typescript
export class HttpError extends Error {
  statusCode: number;
  errors?: string[]; // Optional array for validation errors

  constructor(message: string, statusCode: number = 500, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, HttpError.prototype); // Proper inheritance for instanceof
  }
}
```