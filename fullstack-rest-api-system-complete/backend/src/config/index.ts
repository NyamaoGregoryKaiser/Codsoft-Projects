import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface AppConfig {
  port: number;
  nodeEnv: string;
  secretKey: string;
  refreshSecretKey: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  secretKey: process.env.SECRET_KEY || 'supersecretjwtkeythatshouldbeverylongandcomplexinproduction',
  refreshSecretKey: process.env.REFRESH_SECRET_KEY || 'anothersecretkeyforrefresh',
  jwtAccessExpiration: process.env.JWT_ACCESS_EXPIRATION || '1h',
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
};