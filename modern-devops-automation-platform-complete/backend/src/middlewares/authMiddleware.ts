```typescript
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyJwt } from '../utils/jwt';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UnauthorizedError, ForbiddenError } from '../utils/errorHandler';

// Extend the Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const decoded = verifyJwt(token);

    if (!decoded || typeof decoded === 'string' || !decoded.id) {
      throw new UnauthorizedError('Invalid token');
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.id },
      select: ['id', 'username', 'email'], // Select only necessary fields
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: error.message });
    }
    // Handle JWT specific errors like TokenExpiredError
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication token expired' });
    }
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid authentication token' });
    }
    next(error); // Pass other errors to the general error handler
  }
};

/**
 * Middleware to check if the authenticated user is the owner of a resource.
 * Assumes the resource ID is available in req.params and the resource has an 'owner' relation or similar.
 * @param getResourceById A function that takes resourceId and ownerId, and returns the resource or null.
 * @returns An Express middleware function.
 */
export const authorizeOwner = (getResourceById: (resourceId: string, ownerId: string) => Promise<any | null>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id || req.params.projectId || req.params.taskId;
      const userId = req.user?.id;

      if (!userId || !resourceId) {
        throw new ForbiddenError('Insufficient information to authorize resource ownership.');
      }

      const resource = await getResourceById(resourceId, userId);

      if (!resource) {
        // If resource isn't found, it could be a 404 or 403.
        // For security, it's often better to treat as 404 if not found at all,
        // but 403 if found but not owned.
        // Here, the `getResourceById` implies finding *and* checking ownership.
        // So, if it returns null, it means either not found OR not owned by this user.
        // We'll throw Forbidden for simplicity for this combined check.
        throw new ForbiddenError('You do not have permission to access this resource, or it does not exist.');
      }
      // Attach the resource to the request for subsequent middleware/controllers
      // This helps avoid re-fetching the resource later.
      (req as any).resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
```