import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma-client';
import { redis } from '../database/redis-client';
import { logger } from '../utils/logger';

export const checkHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    await redis.ping();

    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      redis: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    next(error); // Pass error to the error handling middleware
  }
};