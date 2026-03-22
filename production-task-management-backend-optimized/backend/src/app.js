```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const xss = require('xss-clean');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const httpStatus = require('http-status');
const config = require('./config');
const routes = require('./routes/v1');
const logger = require('./middlewares/logger');

const app = express();

// setup morgan for logging HTTP requests
app.use(morgan(config.env === 'development' ? 'dev' : 'combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// enable cors
app.use(cors());
app.options('*', cors());

// v1 api routes
app.use('/api', routes);

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