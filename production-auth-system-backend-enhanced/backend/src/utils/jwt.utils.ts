import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import logger from './logger';
import { UserRole } from '../entities/User';

interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.accessExpiration });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, jwtConfig.refreshSecret, { expiresIn: jwtConfig.refreshExpiration });
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, jwtConfig.secret) as TokenPayload;
  } catch (error) {
    logger.debug('Access token verification failed:', (error as Error).message);
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret) as TokenPayload;
  } catch (error) {
    logger.debug('Refresh token verification failed:', (error as Error).message);
    return null;
  }
};

/**
 * Calculates the expiration date for a refresh token from its expiration string.
 * @param expirationString - e.g., '7d', '30d', '1h'
 * @returns Date object representing the expiration.
 */
export const getRefreshTokenExpirationDate = (expirationString: string): Date => {
  const now = new Date();
  const unit = expirationString.slice(-1);
  const value = parseInt(expirationString.slice(0, -1), 10);

  if (isNaN(value)) {
    logger.warn(`Invalid JWT_REFRESH_EXPIRATION format: ${expirationString}. Defaulting to 7 days.`);
    now.setDate(now.getDate() + 7); // Default to 7 days
    return now;
  }

  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + value);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h':
      now.setHours(now.getHours() + value);
      break;
    case 'd':
      now.setDate(now.getDate() + value);
      break;
    default:
      logger.warn(`Unknown JWT_REFRESH_EXPIRATION unit: ${unit}. Defaulting to 7 days.`);
      now.setDate(now.getDate() + 7); // Default to 7 days
      break;
  }
  return now;
};