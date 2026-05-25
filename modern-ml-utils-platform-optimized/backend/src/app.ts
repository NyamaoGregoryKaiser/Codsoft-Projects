import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import httpStatus from 'http-status';

// Import config and error handling
import config from './config';
import ApiError from './shared/errors/ApiError';
import errorHandler from './middleware/errorHandler';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import datasetRoutes from './modules/datasets/dataset.routes';
import dataUtilityRoutes from './modules/data-utilities/data-utility.routes';

const app: Application = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());
app.options('*', cors()); // pre-flight requests

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/datasets', datasetRoutes);
app.use('/api/v1/data-utilities', dataUtilityRoutes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not Found'));
});

// handle error
app.use(errorHandler);

export default app;