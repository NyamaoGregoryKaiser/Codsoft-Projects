```typescript
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb, initializeDatabase } from '../../src/database/db';
import { errorHandler } from '../../src/middleware/errorHandler';
import { authenticateToken } from '../../src/middleware/auth.middleware';
import visualizationRoutes from '../../src/routes/visualization.routes';
import { UserRole } from '../../src/models/User';
import { ChartType } from '../../src/models/Visualization';

// Mock logger to suppress console output during tests
jest.mock('../../src/utils/logger');

const app = express();
app.use(express.json());
// Apply auth middleware to all routes, then the visualization routes
app.use('/api/visualizations', authenticateToken, visualizationRoutes);
app.use(errorHandler);

let db: any;
let userId: string;
let dataSourceId: string;

const testUser = {
  username: 'vizuser',
  email: 'viz@example.com',
  password: 'vizpassword',
  role: UserRole.User,
};

beforeAll(async () => {
  process.env.DATA_DIR = './test_data_db'; // For SQLite DB file
  process.env.DB_FILE = 'test_viz_db.sqlite';
  await initializeDatabase();
  db = getDb();

  // Create necessary tables
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
    CREATE TABLE IF NOT EXISTS visualizations (
        id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
        user_id TEXT NOT NULL,
        data_source_id TEXT NOT NULL,
        name TEXT NOT NULL,
        chart_type TEXT NOT NULL,
        config TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (data_source_id) REFERENCES data_sources(id) ON DELETE CASCADE
    );
  `);

  const hashedPassword = await bcrypt.hash(testUser.password, 10);
  const userResult = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run(testUser.username, testUser.email, hashedPassword, testUser.role);
  userId = userResult.lastInsertRowid;

  // Insert a dummy data source for the test user
  const dataSourceResult = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(userId, 'Test Data Source', 'dummy/path.csv', '["columnA","columnB"]');
  dataSourceId = dataSourceResult.lastInsertRowid;

  // Manually mock req.user for authentication
  app.use((req, res, next) => {
    (req as any).user = { id: userId, email: testUser.email, role: testUser.role };
    next();
  });
});

beforeEach(() => {
  // Clear visualizations table before each test
  db.exec('DELETE FROM visualizations');
});

afterAll(() => {
  db.close();
});

describe('Visualization Routes', () => {
  describe('POST /api/visualizations', () => {
    it('should create a new visualization', async () => {
      const newViz = {
        data_source_id: dataSourceId,
        name: 'My New Bar Chart',
        chart_type: ChartType.Bar,
        config: {
          x_axis: 'columnA',
          y_axis: 'columnB',
          title: 'A vs B'
        }
      };

      const res = await request(app)
        .post('/api/visualizations')
        .send(newViz);

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toEqual(newViz.name);
      expect(res.body.chart_type).toEqual(newViz.chart_type);
      expect(res.body.data_source_id).toEqual(newViz.data_source_id);
      expect(res.body.config).toEqual(newViz.config);

      const vizInDb = db.prepare('SELECT * FROM visualizations WHERE id = ?').get(res.body.id);
      expect(vizInDb).toBeDefined();
      expect(vizInDb.user_id).toEqual(userId);
      expect(JSON.parse(vizInDb.config)).toEqual(newViz.config);
    });

    it('should return 400 if required fields are missing', async () => {
      const incompleteViz = {
        name: 'Incomplete Viz',
        chart_type: ChartType.Line,
        config: {}
      };

      const res = await request(app)
        .post('/api/visualizations')
        .send(incompleteViz);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Missing required fields');
    });

    it('should return 400 for invalid chart type', async () => {
      const invalidViz = {
        data_source_id: dataSourceId,
        name: 'Invalid Chart',
        chart_type: 'invalid_type', // Invalid chart type
        config: {}
      };

      const res = await request(app)
        .post('/api/visualizations')
        .send(invalidViz);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Invalid chart type');
    });

    it('should return 404 if data source does not exist or is unauthorized', async () => {
      const newViz = {
        data_source_id: 'nonexistent_data_source', // Invalid ID
        name: 'My New Bar Chart',
        chart_type: ChartType.Bar,
        config: {}
      };

      const res = await request(app)
        .post('/api/visualizations')
        .send(newViz);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Data source not found or unauthorized');
    });
  });

  describe('GET /api/visualizations', () => {
    it('should return all visualizations for the authenticated user', async () => {
      db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(userId, dataSourceId, 'Viz 1', ChartType.Bar, '{}');
      db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(userId, dataSourceId, 'Viz 2', ChartType.Line, '{}');

      const res = await request(app).get('/api/visualizations');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].user_id).toEqual(userId);
      expect(res.body[0].config).toEqual({}); // JSON parsed
    });

    it('should return an empty array if no visualizations exist for the user', async () => {
      const res = await request(app).get('/api/visualizations');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/visualizations/:id', () => {
    let vizId: string;
    const vizConfig = { title: 'Specific Viz', x: 'colA' };
    beforeEach(() => {
      const result = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(userId, dataSourceId, 'Specific Viz', ChartType.Pie, JSON.stringify(vizConfig));
      vizId = result.lastInsertRowid;
    });

    it('should return a specific visualization by ID for the authenticated user', async () => {
      const res = await request(app).get(`/api/visualizations/${vizId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(vizId);
      expect(res.body.name).toEqual('Specific Viz');
      expect(res.body.chart_type).toEqual(ChartType.Pie);
      expect(res.body.config).toEqual(vizConfig);
    });

    it('should return 404 if visualization not found or unauthorized', async () => {
      const res = await request(app).get('/api/visualizations/nonexistent_id');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Visualization not found or unauthorized');
    });

    it('should return 404 if visualization belongs to another user', async () => {
      const otherUserId = 'other_user_id';
      db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(otherUserId, 'other_viz_user', 'other_viz@example.com', 'hashedpass', UserRole.User);
      const otherDataSourceResult = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(otherUserId, 'Other Viz Data Source', 'dummy/path2.csv', '["C","D"]');
      const otherDataSourceId = otherDataSourceResult.lastInsertRowid;
      const otherVizResult = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(otherUserId, otherDataSourceId, 'Other User Viz', ChartType.Bar, '{}');
      const otherVizId = otherVizResult.lastInsertRowid;

      const res = await request(app).get(`/api/visualizations/${otherVizId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Visualization not found or unauthorized');
    });
  });

  describe('PUT /api/visualizations/:id', () => {
    let vizId: string;
    beforeEach(() => {
      const result = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(userId, dataSourceId, 'Old Name', ChartType.Bar, '{}');
      vizId = result.lastInsertRowid;
    });

    it('should update an existing visualization', async () => {
      const updatedViz = {
        name: 'New Name for Bar Chart',
        chart_type: ChartType.Line,
        config: { newSetting: true }
      };

      const res = await request(app)
        .put(`/api/visualizations/${vizId}`)
        .send(updatedViz);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Visualization updated successfully');

      const vizInDb = db.prepare('SELECT * FROM visualizations WHERE id = ?').get(vizId);
      expect(vizInDb.name).toEqual(updatedViz.name);
      expect(vizInDb.chart_type).toEqual(updatedViz.chart_type);
      expect(JSON.parse(vizInDb.config)).toEqual(updatedViz.config);
    });

    it('should return 400 if no update data provided', async () => {
      const res = await request(app)
        .put(`/api/visualizations/${vizId}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('No update data provided');
    });

    it('should return 404 if visualization not found or unauthorized', async () => {
      const res = await request(app)
        .put('/api/visualizations/nonexistent_id')
        .send({ name: 'Update This' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Visualization not found or unauthorized');
    });

    it('should return 400 for invalid chart type in update', async () => {
        const res = await request(app)
          .put(`/api/visualizations/${vizId}`)
          .send({ chart_type: 'invalid_type' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toContain('Invalid chart type');
    });

    it('should allow updating data_source_id to another valid data source', async () => {
        const newDataSourceResult = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(userId, 'New Data Source', 'new/path.csv', '["colZ"]');
        const newDataSourceId = newDataSourceResult.lastInsertRowid;

        const res = await request(app)
            .put(`/api/visualizations/${vizId}`)
            .send({ data_source_id: newDataSourceId });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Visualization updated successfully');

        const vizInDb = db.prepare('SELECT * FROM visualizations WHERE id = ?').get(vizId);
        expect(vizInDb.data_source_id).toEqual(newDataSourceId);
    });

    it('should return 404 if updating with an unauthorized or nonexistent data_source_id', async () => {
        const res = await request(app)
            .put(`/api/visualizations/${vizId}`)
            .send({ data_source_id: 'nonexistent_or_other_user_ds' });

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toEqual('New data source not found or unauthorized');
    });
  });

  describe('DELETE /api/visualizations/:id', () => {
    let vizId: string;
    beforeEach(() => {
      const result = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(userId, dataSourceId, 'To Delete', ChartType.Pie, '{}');
      vizId = result.lastInsertRowid;
    });

    it('should delete a visualization', async () => {
      const res = await request(app).delete(`/api/visualizations/${vizId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Visualization deleted successfully');

      const vizInDb = db.prepare('SELECT * FROM visualizations WHERE id = ?').get(vizId);
      expect(vizInDb).toBeUndefined();
    });

    it('should return 404 if visualization not found or unauthorized', async () => {
      const res = await request(app).delete('/api/visualizations/nonexistent_id');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Visualization not found or unauthorized');
    });
  });
});
```