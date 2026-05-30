```javascript
// Utility to wrap async functions for consistent error handling
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```