import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};