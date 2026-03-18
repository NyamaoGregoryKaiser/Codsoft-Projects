```javascript
/**
 * Standardized API Response structure
 */
class ApiResponse {
  constructor(statusCode, message = "Success", data = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400; // Conventionally, 2xx responses are successful.
  }
}

module.exports = ApiResponse;
```