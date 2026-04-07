```typescript
interface ApiResponseOptions {
  status?: number;
  message?: string;
  data?: any;
  error?: string | string[];
}

class ApiResponse {
  public status: number;
  public message: string;
  public data: any;
  public error: string | string[];

  constructor({ status = 200, message = 'Success', data = null, error = null }: ApiResponseOptions = {}) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.error = error;
  }

  static success(data: any, message = 'Success', status = 200) {
    return new ApiResponse({ status, message, data });
  }

  static error(error: string | string[], message = 'Error', status = 400) {
    return new ApiResponse({ status, message, error });
  }
}

export default ApiResponse;
```