import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRole } from '../models/User.entity';
import logger from './logger';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  if (!config.secretKey) {
    logger.error('JWT_SECRET_KEY is not defined!');
    throw new Error('JWT_SECRET_KEY is not defined!');
  }
  return jwt.sign(payload, config.secretKey, { expiresIn: config.jwtAccessExpiration });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  if (!config.refreshSecretKey) {
    logger.error('JWT_REFRESH_SECRET_KEY is not defined!');
    throw new Error('JWT_REFRESH_SECRET_KEY is not defined!');
  }
  return jwt.sign(payload, config.refreshSecretKey, { expiresIn: config.jwtRefreshExpiration });
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    if (!config.secretKey) {
      logger.error('JWT_SECRET_KEY is not defined!');
      throw new Error('JWT_SECRET_KEY is not defined!');
    }
    return jwt.verify(token, config.secretKey) as JwtPayload;
  } catch (error) {
    logger.warn(`Access token verification failed: ${error.message}`);
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    if (!config.refreshSecretKey) {
      logger.error('JWT_REFRESH_SECRET_KEY is not defined!');
      throw new Error('JWT_REFRESH_SECRET_KEY is not defined!');
    }
    return jwt.verify(token, config.refreshSecretKey) as JwtPayload;
  } catch (error) {
    logger.warn(`Refresh token verification failed: ${error.message}`);
    return null;
  }
};