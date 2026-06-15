import jwt from 'jsonwebtoken';
import config from '../config';
import { UserRole } from '@prisma/client';

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
```