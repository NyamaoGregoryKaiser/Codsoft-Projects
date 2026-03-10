import jwt from 'jsonwebtoken';
import { env } from '@config/env';
import { logger } from '@utils/logger';

interface JwtPayload {
  sub: string; // User ID
  type: 'access' | 'refresh' | 'resetPassword';
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token.
 * @param {string} userId - The user ID for whom the token is generated.
 * @param {number} expiresInMinutes - Expiration time in minutes.
 * @param {'access' | 'refresh' | 'resetPassword'} type - Type of token.
 * @returns {string} The signed JWT token.
 */
export const signJwt = (userId: string, expiresInMinutes: number, type: 'access' | 'refresh' | 'resetPassword'): string => {
  const payload: JwtPayload = {
    sub: userId,
    type: type,
  };
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: `${expiresInMinutes}m` });
  return token;
};

/**
 * Verify a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {JwtPayload | null} The decoded payload if valid, otherwise null.
 */
export const verifyJwt = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.warn('JWT verification failed:', (error as Error).message);
    return null;
  }
};

/**
 * Verify an access token specifically.
 * @param {string} token - The access token to verify.
 * @returns {JwtPayload | null} The decoded payload if valid and of type 'access', otherwise null.
 */
export const verifyAccessToken = (token: string): JwtPayload | null => {
  const payload = verifyJwt(token);
  if (payload && payload.type === 'access') {
    return payload;
  }
  return null;
};