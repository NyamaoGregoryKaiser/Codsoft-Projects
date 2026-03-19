import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const PORT = process.env.PORT || 3000;
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mydb';
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeythatshouldbemorethan32charslong';
export const JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME || '1h';
export const API_PREFIX = '/api/v1';
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests per window
export const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10); // 5 minutes in seconds

// Ensure JWT_SECRET is set
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}