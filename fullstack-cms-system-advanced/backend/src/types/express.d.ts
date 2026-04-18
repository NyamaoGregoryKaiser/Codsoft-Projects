import { User } from '../entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Optional user object for authenticated requests
    }
  }
}