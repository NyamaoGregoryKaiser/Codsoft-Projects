```typescript
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { getDb } from '../database/db';
import { APIError } from '../utils/error';
import { DataSource } from '../models/DataSource';
import { dbConfig } from '../config/db.config';
import logger from '../utils/logger';

const db = getDb();

export const uploadDataSource = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new APIError('No file uploaded', 400));
  }
  if (!req.user?.id) {
    // This should be caught by authenticateToken, but as a safeguard
    fs.unlinkSync(req.file.path); // Clean up uploaded file
    return next(new APIError('Authentication required', 401));
  }

  const { filename, path: filePath, originalname } = req.file;
  const dataSourceName = req.body.name || originalname;
  const userId = req.user.id;

  try {
    // Read CSV to extract headers
    const headers: string[] = await new Promise((resolve, reject) => {
      const results: string[][] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (h: string[]) => {
          resolve(h); // Resolve with the first row of headers
          // Stop parsing further data as we only need headers
          // This is a common pattern for csv-parser to get headers early
          // For full data parsing, you'd collect `data` events.
          // To ensure the stream is closed, one might need more control or an additional pipe.
        })
        .on('data', () => {}) // Consume data events without storing them
        .on('end', () => {
          if (results.length === 0) {
             // If no headers were emitted, but stream ended, implies empty or malformed CSV
             reject(new APIError('CSV file is empty or malformed', 400));
          }
        })
        .on('error', (error) => {
          reject(new APIError(`Error parsing CSV headers: ${error.message}`, 500, error));
        });
    });

    if (headers.length === 0) {
      fs.unlinkSync(filePath); // Clean up file
      return next(new APIError('CSV file has no headers or is empty', 400));
    }

    const result = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(
      userId,
      dataSourceName,
      filePath,
      JSON.stringify(headers)
    );
    const dataSourceId = result.lastInsertRowid;

    logger.info(`Data source uploaded by ${userId}: ${dataSourceName} (${filename})`);
    res.status(201).json({
      id: dataSourceId,
      user_id: userId,
      name: dataSourceName,
      file_path: filePath,
      file_type: 'csv',
      column_headers: headers,
    });
  } catch (error) {
    // Clean up uploaded file if there's an error during processing
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    logger.error(`Error uploading data source for user ${userId}:`, error);
    next(new APIError('Failed to upload data source', 500, error as Error));
  }
};

export const getDataSources = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const dataSources = db.prepare('SELECT id, name, file_path, file_type, column_headers, created_at, updated_at FROM data_sources WHERE user_id = ?').all(userId) as DataSource[];
    const parsedDataSources = dataSources.map(ds => ({
      ...ds,
      column_headers: JSON.parse(ds.column_headers as string), // Parse JSON string back to array
    }));
    logger.debug(`Retrieved ${parsedDataSources.length} data sources for user ${userId}`);
    res.status(200).json(parsedDataSources);
  } catch (error) {
    logger.error(`Error fetching data sources for user ${userId}:`, error);
    next(new APIError('Failed to fetch data sources', 500, error as Error));
  }
};

export const getDataSourceById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const dataSource = db.prepare('SELECT id, name, file_path, file_type, column_headers, created_at, updated_at FROM data_sources WHERE id = ? AND user_id = ?').get(id, userId) as DataSource | undefined;

    if (!dataSource) {
      return next(new APIError('Data source not found or unauthorized', 404));
    }
    logger.debug(`Retrieved data source ${id} for user ${userId}`);
    res.status(200).json({
      ...dataSource,
      column_headers: JSON.parse(dataSource.column_headers as string),
    });
  } catch (error) {
    logger.error(`Error fetching data source ${id} for user ${userId}:`, error);
    next(new APIError('Failed to fetch data source', 500, error as Error));
  }
};

export const getDataSourceData = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const dataSource = db.prepare('SELECT file_path FROM data_sources WHERE id = ? AND user_id = ?').get(id, userId) as Pick<DataSource, 'file_path'> | undefined;

    if (!dataSource) {
      return next(new APIError('Data source not found or unauthorized', 404));
    }

    const fullFilePath = path.resolve(dataSource.file_path); // Ensure path is absolute and correct
    if (!fs.existsSync(fullFilePath)) {
      return next(new APIError('Data file not found on server', 404));
    }

    const data: any[] = await new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(fullFilePath)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(new APIError(`Error parsing CSV data: ${error.message}`, 500, error)));
    });
    logger.debug(`Retrieved data for data source ${id} for user ${userId}`);
    res.status(200).json(data);
  } catch (error) {
    logger.error(`Error fetching data for data source ${id} for user ${userId}:`, error);
    next(new APIError('Failed to retrieve data source data', 500, error as Error));
  }
};

export const deleteDataSource = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!req.user?.id) {
    return next(new APIError('Authentication required', 401));
  }
  const userId = req.user.id;

  try {
    const dataSource = db.prepare('SELECT file_path FROM data_sources WHERE id = ? AND user_id = ?').get(id, userId) as Pick<DataSource, 'file_path'> | undefined;

    if (!dataSource) {
      return next(new APIError('Data source not found or unauthorized', 404));
    }

    // Delete the file from the filesystem
    const fullFilePath = path.resolve(dataSource.file_path);
    if (fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
      logger.info(`Deleted data file: ${fullFilePath}`);
    } else {
      logger.warn(`Data file not found at ${fullFilePath} for data source ${id}. Proceeding with DB deletion.`);
    }

    // Delete the entry from the database
    const result = db.prepare('DELETE FROM data_sources WHERE id = ? AND user_id = ?').run(id, userId);

    if (result.changes === 0) {
      return next(new APIError('Data source not found or unauthorized (after file cleanup attempt)', 404));
    }
    logger.info(`Data source ${id} deleted by user ${userId}`);
    res.status(200).json({ message: 'Data source deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting data source ${id} for user ${userId}:`, error);
    next(new APIError('Failed to delete data source', 500, error as Error));
  }
};
```