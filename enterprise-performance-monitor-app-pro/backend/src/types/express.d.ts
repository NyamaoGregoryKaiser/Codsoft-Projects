import { User } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Authenticated user
      apiKeyApplication?: {
        id: string; // Application ID from API key
        ownerId: string; // Owner ID of the application
      };
    }
  }
}