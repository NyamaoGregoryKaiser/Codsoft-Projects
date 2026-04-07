```javascript
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Catch any errors and pass them to the global error handler
  };
};
```