import { UserRole } from './auth';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  merchantId?: string;
  createdAt: string;
  updatedAt: string;
}