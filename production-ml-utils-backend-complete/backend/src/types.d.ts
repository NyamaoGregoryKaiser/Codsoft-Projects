```typescript
import { Request } from 'express';
import { User } from './modules/users/user.entity';

// Extend the Express Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: MulterFile; // For specific file upload handling
      files?: MulterFile[];
    }
  }
}

// Minimal MulterFile definition for type safety
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}
```