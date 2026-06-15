import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize'; // Even with Prisma, good practice for sanitization generally
import hpp from 'hpp';
import compression from 'compression';
import { json, urlencoded } from 'body-parser';
import routes from './routes';
import { errorConverter, errorHandler, ApiError } from './middlewares/error.middleware';
import apiLimiter from './middlewares/rateLimit.middleware';
import config from './config';
import logger from './utils/logger';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());
app.options('*', cors()); // pre-flight requests

// parse json request body
app.use(json());

// parse urlencoded request body
app.use(urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize()); // Prevent NoSQL injection (even for relational DB, it guards against malformed JSON keys)

// gzip compression
app.use(compression());

// Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Limit repeated failed requests to auth endpoints
if (config.nodeEnv === 'production') {
  app.use(apiLimiter);
}

// v1 api routes
app.use(config.apiPrefix, routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(404, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
```