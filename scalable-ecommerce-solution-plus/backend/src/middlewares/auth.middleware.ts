import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserRole, AuthRequest } from '../types';
import logger from '../config/logger';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Authentication failed: No token provided or invalid format.');
        return res.status(401).json({ message: 'Authentication required: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
        logger.warn('Authentication failed: Invalid or expired token.');
        return res.status(403).json({ message: 'Authentication failed: Invalid or expired token' });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
};

export const authorize = (roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            logger.warn(`Authorization failed for user ${req.userId}: Required roles [${roles.join(', ')}], actual role ${req.userRole}`);
            return res.status(403).json({ message: 'Authorization failed: You do not have permission to perform this action' });
        }
        next();
    };
};