```typescript
import { Request, Response, NextFunction } from 'express';
import { databaseMonitorService } from './database-monitor.service';
import { HttpError } from '../shared/http-error';
import { z } from 'zod';
import { validate } from '../shared/validation';

const connectionIdParamSchema = z.object({
  params: z.object({
    connectionId: z.string().uuid('Invalid connection ID format'),
  }),
});

const analyzeQuerySchema = z.object({
  params: z.object({
    connectionId: z.string().uuid('Invalid connection ID format'),
  }),
  body: z.object({
    query: z.string().min(1, 'Query is required'),
  }),
});

const createIndexSchema = z.object({
  params: z.object({
    connectionId: z.string().uuid('Invalid connection ID format'),
  }),
  body: z.object({
    tableName: z.string().min(1, 'Table name is required'),
    columns: z.array(z.string().min(1, 'Column name cannot be empty')).min(1, 'At least one column is required'),
    indexName: z.string().optional(),
    unique: z.boolean().optional().default(false),
  }),
});

const dropIndexSchema = z.object({
  params: z.object({
    connectionId: z.string().uuid('Invalid connection ID format'),
  }),
  body: z.object({
    indexName: z.string().min(1, 'Index name is required'),
  }),
});

const getTableSchemaSchema = z.object({
  params: z.object({
    connectionId: z.string().uuid('Invalid connection ID format'),
  }),
  query: z.object({
    tableName: z.string().optional(),
  }),
});

export class DatabaseMonitorController {
  async getActiveQueries(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new HttpError('User not authenticated', 401);
      const { connectionId } = req.params;
      const minDurationMs = parseInt(req.query.minDurationMs as string) || 0;
      const queries = await databaseMonitorService.getActiveQueries(connectionId, req.user.id, minDurationMs);
      res.status(200).json({ success: true, data: queries });
    } catch (error) {
      next(error);
    }
  }

  async getSlowQueries(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new HttpError('User not authenticated', 401);
      const { connectionId } = req.params;
      const thresholdMs = parseInt(req.query.thresholdMs as string) || 1000; // Default to 1 second
      const queries = await databaseMonitorService.getSlowQueries(connectionId, req.user.id, thresholdMs);
      res.status(200).json({ success: true, data: queries });
    } catch (error) {
      next(error);
    }
  }

  async analyzeQuery(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new HttpError('User not authenticated', 401);
      const { connectionId } = req.params;
      const { query } = req.body;
      const explainOutput = await databaseMonitorService.analyzeQuery(connectionId, req.user.id, query);
      res.status(200).json({ success: true, data: explainOutput });
    } catch (error) {
      next(error);
    }
  }

  async getIndexes(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new HttpError('User not authenticated', 401);
      const { connectionId } = req.params;
      const indexes = await databaseMonitorService.getIndexes(connectionId, req.user.id);
      res.status(200).json({ success: true, data: indexes });
    } catch (error) {
      next(error);
    }
  }

  async createIndex(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new HttpError('User not authenticated', 401);
      const { connectionId } = req.params;
      const { tableName, columns, indexName, unique } = req.body;
      const message = await databaseMonitorService.createIndex(connectionId, req.user.id, tableName, columns, indexName, unique);
      res.status(201).json({ success: true, message });
    } catch (error) {
      next(error);
    }
  }

  async dropIndex(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new HttpError('User not authenticated', 401);
      const { connectionId } = req.params;
      const { indexName } = req.body;
      const message = await databaseMonitorService.dropIndex(connectionId, req.user.id, indexName);
      res.status(200).json({ success: true, message });
    } catch (error) {
      next(error);
    }
  }

  async getTableSchema(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new HttpError('User not authenticated', 401);
      const { connectionId } = req.params;
      const tableName = req.query.tableName as string | undefined;
      const schema = await databaseMonitorService.getTableSchema(connectionId, req.user.id, tableName);
      res.status(200).json({ success: true, data: schema });
    } catch (error) {
      next(error);
    }
  }
}

export const databaseMonitorController = new DatabaseMonitorController();
export const validateConnectionIdParam = validate(connectionIdParamSchema);
export const validateAnalyzeQuery = validate(analyzeQuerySchema);
export const validateCreateIndex = validate(createIndexSchema);
export const validateDropIndex = validate(dropIndexSchema);
export const validateGetTableSchema = validate(getTableSchemaSchema);
```