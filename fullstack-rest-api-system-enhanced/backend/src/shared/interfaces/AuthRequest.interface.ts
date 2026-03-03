import { Request } from 'express';
import { User } from '../../database/entities/User';

export interface AuthRequest extends Request {
  user?: User;
}