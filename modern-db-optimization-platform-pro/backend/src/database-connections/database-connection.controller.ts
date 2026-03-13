```typescript
import { Request, Response, NextFunction } from 'express';
import { databaseConnectionService } from './database-connection.service';
import { HttpError } from '../shared/http-error';
import { z } from 'zod';
import { validate, passwordSchema } from '../shared/validation';

const createConnectionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    host: z.string().min(1, 'Host is required'),
    port: z.number().int().positive().max(65535, 'Port must be between 1 and 65535'),
    dbName: z.string().min(1, 'Database name is required'),
    dbUser: z.string().min(1, 'Database user is required'),
    dbPassword: passwordSchema.min(1, 'Database password is required'),
  }),
});

const updateConnectionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid connection ID format'),
  }),
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    host: z.string().min(1, 'Host is required').optional(),
    port: z.number().int().positive().max(65535, 'Port must be between 1 and 65535').optional(),
    dbName: z.string().min(1, 'Database name is required').optional(),
    dbUser: z.string().min(1, 'Database user is required').optional(),
    dbPassword: passwordSchema.min(1, 'Database password is required').optional(),
  }).partial(), // All fields are optional for update
});

const connectionIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid connection ID format'),
  }),
});

export class DatabaseConnectionController {
  async createConnection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new HttpError('User not authenticated', 401));
      }
      const { name, host, port, dbName, dbUser, dbPassword } = req.body;
      const connection = await databaseConnectionService.createConnection(
        req.user.id,
        name,
        host,
        port,
        dbName,
        dbUser,
        dbPassword
      );
      res.status(201).json({
        success: true,
        message: 'Database connection created',
        data: {
          id: connection.id,
          name: connection.name,
          host: connection.host,
          port: connection.port,
          dbName: connection.dbName,
          dbUser: connection.dbUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConnections(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new HttpError('User not authenticated', 401));
      }
      const connections = await databaseConnectionService.getConnectionsByUser(req.user.id);
      res.status(200).json({ success: true, data: connections });
    } catch (error) {
      next(error);
    }
  }

  async getConnection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new HttpError('User not authenticated', 401));
      }
      const { id } = req.params;
      const connection = await databaseConnectionService.getConnectionDetails(id, req.user.id);
      // Exclude password from response for security, even though it's "encrypted"
      const { password, ...rest } = connection;
      res.status(200).json({ success: true, data: rest });
    } catch (error) {
      next(error);
    }
  }

  async updateConnection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new HttpError('User not authenticated', 401));
      }
      const { id } = req.params;
      const updates = req.body;
      const updatedConnection = await databaseConnectionService.updateConnection(
        id,
        req.user.id,
        updates
      );
      res.status(200).json({
        success: true,
        message: 'Connection updated successfully',
        data: {
          id: updatedConnection.id,
          name: updatedConnection.name,
          host: updatedConnection.host,
          port: updatedConnection.port,
          dbName: updatedConnection.dbName,
          dbUser: updatedConnection.dbUser,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteConnection(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(new HttpError('User not authenticated', 401));
      }
      const { id } = req.params;
      await databaseConnectionService.deleteConnection(id, req.user.id);
      res.status(204).json({ success: true, message: 'Connection deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const databaseConnectionController = new DatabaseConnectionController();
export const validateCreateConnection = validate(createConnectionSchema);
export const validateUpdateConnection = validate(updateConnectionSchema);
export const validateConnectionId = validate(connectionIdSchema);
```