```javascript
const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan'); // No morgan config provided yet, will add for logging
const { errorConverter, errorHandler } = require('./middleware/error');
const ApiError = require('./utils/ApiError');
const routes = require('./routes/v1');

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Set security HTTP headers
app.use(helmet());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize request data
app.use(xss());
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Enable cors
app.use(cors({
  origin: config.frontendUrl, // Allow requests from our frontend
  credentials: true,
}));
app.options('*', cors()); // Enable pre-flight for all routes

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
```