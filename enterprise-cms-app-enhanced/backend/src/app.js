const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cors = require('cors');
const httpStatus = require('http-status');
const config = require('./config/config');
const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middlewares/error.middleware');
const ApiError = require('./utils/ApiError');
const limiter = require('./middlewares/rateLimit.middleware');
const path = require('path');
const logger = require('./config/logger');

const app = express();

if (config.env !== 'test') {
  app.use(limiter);
}

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.options('*', cors()); // Enable pre-flight across all routes

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(hpp()); // Prevent HTTP Parameter Pollution

// gzip compression
app.use(compression());

// Serve static media files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
logger.info(`Serving static files from ${path.join(__dirname, '../uploads')} at /uploads`);


// API routes
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