import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_ACCESS_EXPIRATION_MINUTES, JWT_REFRESH_EXPIRATION_DAYS } from '../config/env';
import { User } from '../database/entities/User.entity';

interface TokenPayload {
  userId: string;
  role: string;
}

export const generateToken = (
  user: User,
  expiresInMinutes: number = JWT_ACCESS_EXPIRATION_MINUTES
): string => {
  const payload: TokenPayload = {
    userId: user.id,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${expiresInMinutes}m` });
};

export const generateAuthTokens = (user: User) => {
  const accessToken = generateToken(user, JWT_ACCESS_EXPIRATION_MINUTES);
  const refreshToken = generateToken(user, JWT_REFRESH_EXPIRATION_DAYS * 24 * 60); // Convert days to minutes
  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (error) {
    return null;
  }
};