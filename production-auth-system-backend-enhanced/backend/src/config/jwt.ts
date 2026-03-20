import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'supersecretjwtkey',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'anothersupersecretrefreshkey',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
};