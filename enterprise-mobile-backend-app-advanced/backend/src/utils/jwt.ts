import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import config from '../config/env';

interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export const generateToken = (
  userId: string,
  email: string,
  role: UserRole,
  type: 'access' | 'refresh'
): string => {
  const expiresIn =
    type === 'access'
      ? `${config.JWT_ACCESS_EXPIRATION_MINUTES}m`
      : `${config.JWT_REFRESH_EXPIRATION_DAYS}d`;

  const payload: TokenPayload = { userId, email, role, type };
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};