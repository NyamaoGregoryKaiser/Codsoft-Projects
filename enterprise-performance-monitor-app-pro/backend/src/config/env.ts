import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_USER: process.env.DB_USER || 'perfmonuser',
  DB_PASSWORD: process.env.DB_PASSWORD || 'perfmonpassword',
  DB_NAME: process.env.DB_NAME || 'perfmondb',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  API_KEY_SECRET: process.env.API_KEY_SECRET || 'supersecretapikey', // Used for API key hashing/validation
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10), // seconds
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
  PERF_DATA_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.PERF_DATA_RATE_LIMIT_MAX_REQUESTS || '1000', 10), // 1000 requests per window for perf data
};