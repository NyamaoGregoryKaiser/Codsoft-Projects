import jwt from 'jsonwebtoken';
import config from '../config';
import { UserRole } from '../modules/users/user.entity';

interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const generateToken = (userId: string, role: UserRole): string => {
  const payload: JwtPayload = { userId, role };
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};