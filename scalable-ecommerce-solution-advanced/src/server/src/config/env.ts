import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value || defaultValue!;
};

export const env = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVar('PORT', '5000'), 10),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_ACCESS_EXPIRATION_MINUTES: parseInt(getEnvVar('JWT_ACCESS_EXPIRATION_MINUTES', '30'), 10),
  JWT_REFRESH_EXPIRATION_DAYS: parseInt(getEnvVar('JWT_REFRESH_EXPIRATION_DAYS', '7'), 10),

  DB_HOST: getEnvVar('DB_HOST'),
  DB_PORT: parseInt(getEnvVar('DB_PORT', '5432'), 10),
  DB_USERNAME: getEnvVar('DB_USERNAME'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD'),
  DB_DATABASE: getEnvVar('DB_DATABASE'),

  REDIS_HOST: getEnvVar('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(getEnvVar('REDIS_PORT', '6379'), 10),

  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  LOG_DIR: getEnvVar('LOG_DIR', 'logs'),
};

export const {
  PORT,
  JWT_SECRET,
  JWT_ACCESS_EXPIRATION_MINUTES,
  JWT_REFRESH_EXPIRATION_DAYS,
  DB_HOST,
  DB_PORT,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
  REDIS_HOST,
  REDIS_PORT,
  LOG_LEVEL,
  LOG_DIR
} = env;