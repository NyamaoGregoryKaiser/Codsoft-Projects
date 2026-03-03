import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { UserRole } from '../../database/entities/User';

interface TokenPayload {
  id: string;
  role: UserRole;
}

export const generateToken = (id: string, role: UserRole): string => {
  return jwt.sign({ id, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};