import { User } from '../database/entities/User'; // Adjust path if necessary

// Extend the Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User; // Add the 'user' property to Request
    }
  }
}