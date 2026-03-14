```javascript
/**
 * @file Custom API Error class for standardized error responses.
 * @module utils/apiErrors
 */

class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // Mark as operational errors (expected errors)
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    APIError
};
```