/**
 * Utility function to wrap async Express route handlers.
 * It catches any errors thrown by the async function and passes them to the next middleware.
 * This avoids repetitive try-catch blocks in every async controller.
 *
 * @param {Function} fn - The async Express route handler function (req, res, next).
 * @returns {Function} A new function that wraps `fn` with error handling.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;
```

```