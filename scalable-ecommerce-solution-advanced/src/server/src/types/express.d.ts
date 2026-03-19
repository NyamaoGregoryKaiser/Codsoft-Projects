import { User } from '../database/entities/User.entity';

// To extend the Request object in Express with our custom user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
      // You can add more custom properties here if needed, e.g.,
      // isAuthenticated?: boolean;
    }
  }
}