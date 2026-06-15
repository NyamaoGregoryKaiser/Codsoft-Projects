import { Request, Response, NextFunction } from 'express';
import * as targetDatabaseService from '../services/targetDatabase.service';
import { ApiError } from '../middlewares/error.middleware';

const createTargetDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, connectionString, description } = req.body;
    if (!req.user?.id) {
      throw new ApiError(401, 'User not authenticated.');
    }
    const newDb = await targetDatabaseService.createTargetDatabase({
      name, type, connectionString, description, ownerId: req.user.id
    });
    res.status(201).json(newDb);
  } catch (error) {
    next(error);
  }
};

const getTargetDatabases = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbs = await targetDatabaseService.getAllTargetDatabases();
    res.status(200).json(dbs);
  } catch (error) {
    next(error);
  }
};

const getTargetDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = await targetDatabaseService.getTargetDatabaseById(req.params.id);
    if (!db) {
      throw new ApiError(404, 'Target Database not found');
    }
    res.status(200).json(db);
  } catch (error) {
    next(error);
  }
};

const updateTargetDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedDb = await targetDatabaseService.updateTargetDatabase(req.params.id, req.body);
    res.status(200).json(updatedDb);
  } catch (error) {
    next(error);
  }
};

const deleteTargetDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await targetDatabaseService.deleteTargetDatabase(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export {
  createTargetDatabase,
  getTargetDatabases,
  getTargetDatabase,
  updateTargetDatabase,
  deleteTargetDatabase,
};
```