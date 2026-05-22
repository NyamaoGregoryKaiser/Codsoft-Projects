```typescript
// Standardized API Response structure

interface ApiResponseOptions<T> {
  statusCode?: number;
  message?: string;
  data?: T;
  pagination?: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

class ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
  success: boolean;
  pagination?: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };

  constructor(options: ApiResponseOptions<T> = {}) {
    this.statusCode = options.statusCode || 200;
    this.message = options.message || 'Success';
    this.data = options.data !== undefined ? options.data : null;
    this.success = this.statusCode >= 200 && this.statusCode < 300;
    if (options.pagination) {
      this.pagination = options.pagination;
    }
  }

  static success<T>(data: T, message: string = 'Success', statusCode: number = 200, pagination?: any): ApiResponse<T> {
    return new ApiResponse({ statusCode, message, data, pagination });
  }

  static error(message: string = 'Error', statusCode: number = 500): ApiResponse<null> {
    return new ApiResponse({ statusCode, message, data: null });
  }
}

export default ApiResponse;
```