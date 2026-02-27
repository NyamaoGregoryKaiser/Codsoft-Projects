import jwt from 'jsonwebtoken';
import config from '../config';
import { JwtPayload, UserRole } from '../types';

export const generateToken = (userId: string, role: UserRole): string => {
    const payload: JwtPayload = { userId, role };
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

export const verifyToken = (token: string): JwtPayload | null => {
    try {
        return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch (error) {
        return null;
    }
};