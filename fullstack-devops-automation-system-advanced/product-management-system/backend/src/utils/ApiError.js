const httpStatus = require('http-status');

/**
 * Custom Error class for API errors.
 * Extends Node.js built-in Error.
 */
class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   * @param {number} statusCode - HTTP status code (e.g., 400, 404, 500).
   * @param {string} message - Error message.
   * @param {boolean} [isOperational=true] - Indicates if the error is operational (e.g., client error, validation error) or a programming error.
   * @param {string} [stack=''] - Error stack trace.
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
```

```