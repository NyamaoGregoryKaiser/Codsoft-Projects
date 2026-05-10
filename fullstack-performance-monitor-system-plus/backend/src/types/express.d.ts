// types/express.d.ts
import { Request } from 'express';
import { User, Project } from '@prisma/client'; // Import Prisma models

declare module 'express-serve-static-core' {
  interface Request {
    user?: Pick<User, 'id' | 'email' | 'name'>;
    project?: Project;
  }
}

export interface AuthRequest extends Request {
  user?: Pick<User, 'id' | 'email' | 'name'>;
  project?: Project; // Project attached after authorizeProjectAccess
}