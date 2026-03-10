import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_ACCESS_EXPIRATION_MINUTES: z.coerce.number().int().positive().default(30),
  JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number().int().positive().default(7),
  JWT_COOKIE_NAME_ACCESS: z.string().default('accessToken'),
  JWT_COOKIE_NAME_REFRESH: z.string().default('refreshToken'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100), // 100 requests
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(3600), // 1 hour
  EMAIL_SERVICE: z.string().optional(),
  EMAIL_USER: z.string().email().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@yourdomain.com'),
  RESET_PASSWORD_URL: z.string().url().default('http://localhost:3000/reset-password'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Environment variable validation error:', parsedEnv.error.format());
  throw new Error('Missing or invalid environment variables');
}

export const env = {
  ...parsedEnv.data,
  isDevelopment: parsedEnv.data.NODE_ENV === 'development',
  isProduction: parsedEnv.data.NODE_ENV === 'production',
  corsOrigins: parsedEnv.data.CORS_ORIGINS, // Already a string, no need to split here, will be split in app.ts
};