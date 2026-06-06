```javascript
/**
 * Custom Error class for API-specific errors.
 * Extends Node.js built-in Error.
 */
class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   * @param {number} statusCode - HTTP status code for the error.
   * @param {string} message - A human-readable message describing the error.
   * @param {boolean} [isOperational=true] - Indicates if the error is operational (expected) or programming (unexpected).
   * @param {string} [stack=''] - The stack trace of the error.
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