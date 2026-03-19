import { UserRole } from '@prisma/client';

// Extend the Express Request interface to include the `user` property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}