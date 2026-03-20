import { UserRole } from '../entities/User';

// Augment the Express Request type to include a 'user' property
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}