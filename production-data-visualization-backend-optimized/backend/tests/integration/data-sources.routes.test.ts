```typescript
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { getDb, initializeDatabase } from '../../src/database/db';
import { errorHandler } from '../../src/middleware/errorHandler';
import { authenticateToken } from '../../src/middleware/auth.middleware';
import dataSourceRoutes from '../../src/routes/dataSource.routes';
import { UserRole } from '../../src/models/User';
import { dbConfig } from '../../src/config/db.config';

// Mock logger to suppress console output during tests
jest.mock('../../src/utils/logger');

const app = express();
app.use(express.json());
// Apply auth middleware to all routes, then the data source routes
app.use('/api/data-sources', authenticateToken, dataSourceRoutes);
app.use(errorHandler);

let db: any;
let authToken: string;
let userId: string;

const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  role: UserRole.User,
};

const TEST_DATA_DIR = path.join(__dirname, 'test_data_uploads');

beforeAll(async () => {
  // Ensure test data directory exists
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  // Mock dbConfig to point to test_data_uploads
  jest.spyOn(dbConfig, 'dataStorageDir', 'get').mockReturnValue(TEST_DATA_DIR);

  process.env.DATA_DIR = './test_data_db'; // For SQLite DB file
  process.env.DB_FILE = 'test_db.sqlite';
  await initializeDatabase();
  db = getDb();

  // Create users table and insert test user
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS data_sources (
        id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL DEFAULT 'csv',
        column_headers TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const hashedPassword = await bcrypt.hash(testUser.password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run(testUser.username, testUser.email, hashedPassword, testUser.role);
  userId = result.lastInsertRowid;

  // Manually mock req.user for authentication, as we don't have login route in this test file
  app.use((req, res, next) => {
    (req as any).user = { id: userId, email: testUser.email, role: testUser.role };
    next();
  });
});

beforeEach(() => {
  // Clear data sources table before each test
  db.exec('DELETE FROM data_sources');
});

afterAll(() => {
  db.close();
  // Clean up test data directory
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  // Clean up test DB file
  const testDbPath = path.join(dbConfig.dataStorageDir, process.env.DB_FILE || 'test_db.sqlite');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Data Source Routes', () => {
  describe('POST /api/data-sources/upload', () => {
    it('should upload a CSV file and create a data source', async () => {
      const csvContent = 'header1,header2\nvalue1,value2\n';
      const fileName = 'test.csv';
      const filePath = path.join(TEST_DATA_DIR, fileName);
      fs.writeFileSync(filePath, csvContent);

      const res = await request(app)
        .post('/api/data-sources/upload')
        .attach('file', filePath)
        .field('name', 'My Test Data');

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toEqual('My Test Data');
      expect(res.body.file_type).toEqual('csv');
      expect(res.body.column_headers).toEqual(['header1', 'header2']);
      expect(res.body.file_path).toBeDefined();

      // Check if file exists in the data directory
      expect(fs.existsSync(res.body.file_path)).toBe(true);

      // Check if entry is in DB
      const dataSourceInDb = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(res.body.id);
      expect(dataSourceInDb).toBeDefined();
      expect(dataSourceInDb.user_id).toEqual(userId);
    });

    it('should return 400 if no file is uploaded', async () => {
      const res = await request(app)
        .post('/api/data-sources/upload')
        .field('name', 'No File');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('No file uploaded');
    });

    it('should return 400 if an invalid file type is uploaded', async () => {
      const textContent = 'just plain text';
      const fileName = 'test.txt';
      const filePath = path.join(TEST_DATA_DIR, fileName);
      fs.writeFileSync(filePath, textContent);

      const res = await request(app)
        .post('/api/data-sources/upload')
        .attach('file', filePath)
        .field('name', 'My Text Data');

      expect(res.statusCode).toEqual(500); // Multer error converted to 500 by error handler
      expect(res.body.message).toContain('Only CSV files are allowed!');
      // Ensure the file is cleaned up if Multer rejected it
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should return 400 if CSV file is empty or malformed', async () => {
      const csvContent = ''; // Empty CSV
      const fileName = 'empty.csv';
      const filePath = path.join(TEST_DATA_DIR, fileName);
      fs.writeFileSync(filePath, csvContent);

      const res = await request(app)
        .post('/api/data-sources/upload')
        .attach('file', filePath)
        .field('name', 'Empty CSV');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('CSV file is empty or malformed');
      expect(fs.existsSync(res.body.file_path)).toBe(false); // File should be cleaned up
    });
  });

  describe('GET /api/data-sources', () => {
    it('should return all data sources for the authenticated user', async () => {
      // Insert some data sources
      db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(userId, 'Data 1', path.join(TEST_DATA_DIR, 'data1.csv'), '["A","B"]');
      db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(userId, 'Data 2', path.join(TEST_DATA_DIR, 'data2.csv'), '["C","D"]');

      const res = await request(app).get('/api/data-sources');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].column_headers).toEqual(['A', 'B']); // Should be parsed to array
    });

    it('should return an empty array if no data sources exist for the user', async () => {
      const res = await request(app).get('/api/data-sources');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/data-sources/:id', () => {
    let dataSourceId: string;
    beforeEach(() => {
      const result = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(userId, 'Single Data', path.join(TEST_DATA_DIR, 'single.csv'), '["X","Y"]');
      dataSourceId = result.lastInsertRowid;
    });

    it('should return a specific data source by ID for the authenticated user', async () => {
      const res = await request(app).get(`/api/data-sources/${dataSourceId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(dataSourceId);
      expect(res.body.name).toEqual('Single Data');
      expect(res.body.column_headers).toEqual(['X', 'Y']);
    });

    it('should return 404 if data source is not found', async () => {
      const res = await request(app).get('/api/data-sources/nonexistent_id');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Data source not found or unauthorized');
    });

    it('should return 404 if data source belongs to another user', async () => {
      const otherUserId = 'other_user_id';
      db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(otherUserId, 'other', 'other@example.com', 'hashedpass', UserRole.User);
      const result = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(otherUserId, 'Other User Data', path.join(TEST_DATA_DIR, 'other.csv'), '["Z"]');
      const otherDataSourceId = result.lastInsertRowid;

      const res = await request(app).get(`/api/data-sources/${otherDataSourceId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Data source not found or unauthorized');
    });
  });

  describe('GET /api/data-sources/:id/data', () => {
    let dataSourceId: string;
    let filePath: string;
    beforeEach(() => {
      const csvContent = 'col1,col2\nval1a,val1b\nval2a,val2b\n';
      const fileName = 'data_content.csv';
      filePath = path.join(TEST_DATA_DIR, fileName);
      fs.writeFileSync(filePath, csvContent);
      const result = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(userId, 'Data Content', filePath, '["col1","col2"]');
      dataSourceId = result.lastInsertRowid;
    });

    it('should return the actual data content of a data source', async () => {
      const res = await request(app).get(`/api/data-sources/${dataSourceId}/data`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([
        { col1: 'val1a', col2: 'val1b' },
        { col1: 'val2a', col2: 'val2b' },
      ]);
    });

    it('should return 404 if data source data file is not found on server', async () => {
      // Delete the actual file
      fs.unlinkSync(filePath);

      const res = await request(app).get(`/api/data-sources/${dataSourceId}/data`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Data file not found on server');
    });

    it('should return 404 if data source not found or unauthorized', async () => {
      const res = await request(app).get('/api/data-sources/nonexistent_id/data');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Data source not found or unauthorized');
    });
  });

  describe('DELETE /api/data-sources/:id', () => {
    let dataSourceId: string;
    let filePath: string;
    beforeEach(() => {
      const csvContent = 'A,B\n1,2\n';
      const fileName = 'to_delete.csv';
      filePath = path.join(TEST_DATA_DIR, fileName);
      fs.writeFileSync(filePath, csvContent);
      const result = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(userId, 'To Delete', filePath, '["A","B"]');
      dataSourceId = result.lastInsertRowid;
    });

    it('should delete a data source and its associated file', async () => {
      expect(fs.existsSync(filePath)).toBe(true); // Ensure file exists before delete

      const res = await request(app).delete(`/api/data-sources/${dataSourceId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Data source deleted successfully');

      // Check if file is deleted
      expect(fs.existsSync(filePath)).toBe(false);

      // Check if entry is deleted from DB
      const dataSourceInDb = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(dataSourceId);
      expect(dataSourceInDb).toBeUndefined();
    });

    it('should return 404 if data source not found or unauthorized', async () => {
      const res = await request(app).delete('/api/data-sources/nonexistent_id');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Data source not found or unauthorized');
      expect(fs.existsSync(filePath)).toBe(true); // Original file should not be touched
    });

    it('should still delete DB entry if file is already missing', async () => {
      fs.unlinkSync(filePath); // Manually delete the file before the API call

      const res = await request(app).delete(`/api/data-sources/${dataSourceId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Data source deleted successfully');
      // Check if entry is deleted from DB
      const dataSourceInDb = db.prepare('SELECT * FROM data_sources WHERE id = ?').get(dataSourceId);
      expect(dataSourceInDb).toBeUndefined();
    });
  });
});
```