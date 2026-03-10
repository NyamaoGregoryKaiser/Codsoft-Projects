import morgan, { StreamOptions } from 'morgan';
import { logger } from '@utils/logger';
import { env } from '@config/env';

// Custom stream for Morgan to pipe to Winston
const stream: StreamOptions = {
  write: (message) => logger.info(message.trim()),
};

// Skip all http log if not in development or test
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' || env === 'test';
};

// Morgan middleware configuration
export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream, skip: env.isProduction || env.nodeEnv === 'test' ? skip : undefined } // Only log in development
);