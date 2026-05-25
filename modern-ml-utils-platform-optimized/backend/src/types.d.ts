import { Request } from 'express';
import { User } from './modules/users/entities/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}