```javascript
/**
 * A wrapper for async Express route handlers.
 * It catches any errors (including rejected promises) and passes them to the `next` middleware (error handler).
 * This avoids needing to wrap every `async` route handler in `try...catch` blocks.
 *
 * @param {Function} fn - An async Express route handler (req, res, next).
 * @returns {Function} - A wrapped function that Express can use.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;
```