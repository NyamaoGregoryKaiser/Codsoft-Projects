```javascript
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    statusCode,
    message: process.env.NODE_ENV === 'production' && statusCode === 500 ? 'Internal Server Error' : message,
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Include stack in dev
  });
};

module.exports = errorHandler;
```