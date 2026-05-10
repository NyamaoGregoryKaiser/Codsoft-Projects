import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../error';
import { prisma } from '../database/prisma-client';
import { AuthRequest } from '../types/express';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true }, // Select necessary fields
    });

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError('Invalid token, please log in again!', 401));
  }
};

export const authorizeProjectAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const projectId = req.params.projectId;
  const userId = req.user?.id;

  if (!projectId || !userId) {
    return next(new AppError('Project ID or User ID is missing for authorization check.', 400));
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    if (project.ownerId !== userId) {
      return next(new AppError('You do not have permission to access this project.', 403));
    }

    req.project = project; // Attach project to request for later use
    next();
  } catch (err) {
    next(new AppError('Error authorizing project access.', 500));
  }
};

export const validateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers[process.env.API_KEY_HEADER?.toLowerCase() || 'x-appinsight-api-key'] as string;

  if (!apiKey) {
    return next(new AppError('API Key is required to submit metrics.', 401));
  }

  try {
    const project = await prisma.project.findUnique({
      where: { apikey: apiKey },
    });

    if (!project) {
      return next(new AppError('Invalid API Key.', 401));
    }

    (req as any).project = project; // Attach project to request for metric ingestion
    next();
  } catch (err) {
    next(new AppError('Error validating API Key.', 500));
  }
};