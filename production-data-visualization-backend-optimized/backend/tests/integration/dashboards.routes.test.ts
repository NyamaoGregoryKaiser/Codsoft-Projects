```typescript
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb, initializeDatabase } from '../../src/database/db';
import { errorHandler } from '../../src/middleware/errorHandler';
import { authenticateToken } from '../../src/middleware/auth.middleware';
import dashboardRoutes from '../../src/routes/dashboard.routes';
import { UserRole } from '../../src/models/User';
import { ChartType } from '../../src/models/Visualization';

// Mock logger to suppress console output during tests
jest.mock('../../src/utils/logger');

const app = express();
app.use(express.json());
app.use('/api/dashboards', authenticateToken, dashboardRoutes);
app.use(errorHandler);

let db: any;
let userId: string;
let dataSourceId: string;
let vizId1: string;
let vizId2: string;

const testUser = {
  username: 'dashuser',
  email: 'dash@example.com',
  password: 'dashpassword',
  role: UserRole.User,
};

beforeAll(async () => {
  process.env.DATA_DIR = './test_data_db'; // For SQLite DB file
  process.env.DB_FILE = 'test_dash_db.sqlite';
  await initializeDatabase();
  db = getDb();

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
    CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS dashboard_visualizations (
        dashboard_id TEXT NOT NULL,
        visualization_id TEXT NOT NULL,
        position TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (dashboard_id, visualization_id),
        FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE,
        FOREIGN KEY (visualization_id) REFERENCES visualizations(id) ON DELETE CASCADE
    );
  `);

  const hashedPassword = await bcrypt.hash(testUser.password, 10);
  const userResult = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run(testUser.username, testUser.email, hashedPassword, testUser.role);
  userId = userResult.lastInsertRowid;

  const dataSourceResult = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(userId, 'Test Data Source', 'dummy/path.csv', '["columnA","columnB"]');
  dataSourceId = dataSourceResult.lastInsertRowid;

  const viz1Result = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(userId, dataSourceId, 'Viz 1', ChartType.Bar, JSON.stringify({ title: 'Viz 1 Config' }));
  vizId1 = viz1Result.lastInsertRowid;
  const viz2Result = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(userId, dataSourceId, 'Viz 2', ChartType.Line, JSON.stringify({ title: 'Viz 2 Config' }));
  vizId2 = viz2Result.lastInsertRowid;

  app.use((req, res, next) => {
    (req as any).user = { id: userId, email: testUser.email, role: testUser.role };
    next();
  });
});

beforeEach(() => {
  db.exec('DELETE FROM dashboard_visualizations');
  db.exec('DELETE FROM dashboards');
});

afterAll(() => {
  db.close();
});

describe('Dashboard Routes', () => {
  describe('POST /api/dashboards', () => {
    it('should create a new dashboard without visualizations', async () => {
      const newDashboard = {
        name: 'My New Dashboard',
        description: 'A description for my new dashboard',
      };

      const res = await request(app)
        .post('/api/dashboards')
        .send(newDashboard);

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toEqual(newDashboard.name);
      expect(res.body.description).toEqual(newDashboard.description);
      expect(res.body.visualizations).toBeUndefined();

      const dashboardInDb = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(res.body.id);
      expect(dashboardInDb).toBeDefined();
      expect(dashboardInDb.user_id).toEqual(userId);
    });

    it('should create a new dashboard with visualizations', async () => {
      const newDashboard = {
        name: 'Dashboard with Viz',
        visualizations: [
          { id: vizId1, position: { x: 0, y: 0, w: 6, h: 4 } },
          { id: vizId2, position: { x: 6, y: 0, w: 6, h: 4 } },
        ],
      };

      const res = await request(app)
        .post('/api/dashboards')
        .send(newDashboard);

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.visualizations).toEqual(newDashboard.visualizations);

      const dashboardVizInDb = db.prepare('SELECT * FROM dashboard_visualizations WHERE dashboard_id = ?').all(res.body.id);
      expect(dashboardVizInDb).toHaveLength(2);
      expect(dashboardVizInDb[0].visualization_id).toEqual(vizId1);
      expect(JSON.parse(dashboardVizInDb[0].position)).toEqual(newDashboard.visualizations[0].position);
    });

    it('should return 400 if name is missing', async () => {
      const newDashboard = { description: 'Missing name' };
      const res = await request(app)
        .post('/api/dashboards')
        .send(newDashboard);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Missing required field: name');
    });

    it('should skip unauthorized visualizations when creating dashboard', async () => {
      const otherUserId = 'other_user_id';
      db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(otherUserId, 'other_dash_user', 'other_dash@example.com', 'hashedpass', UserRole.User);
      const otherDataSourceResult = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(otherUserId, 'Other DS', 'dummy/path3.csv', '["E","F"]');
      const otherDataSourceId = otherDataSourceResult.lastInsertRowid;
      const otherVizResult = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(otherUserId, otherDataSourceId, 'Other User Viz', ChartType.Bar, '{}');
      const otherVizId = otherVizResult.lastInsertRowid;


      const newDashboard = {
        name: 'Dashboard with unauthorized viz',
        visualizations: [
          { id: vizId1, position: { x: 0, y: 0, w: 6, h: 4 } },
          { id: otherVizId, position: { x: 6, y: 0, w: 6, h: 4 } }, // Unauthorized visualization
        ],
      };

      const res = await request(app)
        .post('/api/dashboards')
        .send(newDashboard);

      expect(res.statusCode).toEqual(201);
      const dashboardVizInDb = db.prepare('SELECT * FROM dashboard_visualizations WHERE dashboard_id = ?').all(res.body.id);
      expect(dashboardVizInDb).toHaveLength(1); // Only vizId1 should be added
      expect(dashboardVizInDb[0].visualization_id).toEqual(vizId1);
    });
  });

  describe('GET /api/dashboards', () => {
    it('should return all dashboards for the authenticated user', async () => {
      db.prepare('INSERT INTO dashboards (user_id, name) VALUES (?, ?)').run(userId, 'Dashboard A');
      db.prepare('INSERT INTO dashboards (user_id, name) VALUES (?, ?)').run(userId, 'Dashboard B');

      const res = await request(app).get('/api/dashboards');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].user_id).toEqual(userId);
    });

    it('should return an empty array if no dashboards exist for the user', async () => {
      const res = await request(app).get('/api/dashboards');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/dashboards/:id', () => {
    let dashboardId: string;
    beforeEach(() => {
      const dashboardResult = db.prepare('INSERT INTO dashboards (user_id, name, description) VALUES (?, ?, ?)').run(userId, 'Test Dashboard', 'My test dashboard');
      dashboardId = dashboardResult.lastInsertRowid;
      db.prepare('INSERT INTO dashboard_visualizations (dashboard_id, visualization_id, position) VALUES (?, ?, ?)').run(dashboardId, vizId1, JSON.stringify({ x: 0, y: 0, w: 12, h: 6 }));
    });

    it('should return a specific dashboard with its visualizations', async () => {
      const res = await request(app).get(`/api/dashboards/${dashboardId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(dashboardId);
      expect(res.body.name).toEqual('Test Dashboard');
      expect(res.body.visualizations).toHaveLength(1);
      expect(res.body.visualizations[0].id).toEqual(vizId1);
      expect(res.body.visualizations[0].name).toEqual('Viz 1');
      expect(res.body.visualizations[0].config).toEqual({ title: 'Viz 1 Config' }); // JSON parsed
      expect(res.body.visualizations[0].position).toEqual({ x: 0, y: 0, w: 12, h: 6 }); // JSON parsed
    });

    it('should return 404 if dashboard not found or unauthorized', async () => {
      const res = await request(app).get('/api/dashboards/nonexistent_id');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Dashboard not found or unauthorized');
    });
  });

  describe('PUT /api/dashboards/:id', () => {
    let dashboardId: string;
    let vizId3: string;
    beforeEach(() => {
      const dashboardResult = db.prepare('INSERT INTO dashboards (user_id, name, description) VALUES (?, ?, ?)').run(userId, 'Dashboard for Update', 'Old Description');
      dashboardId = dashboardResult.lastInsertRowid;
      db.prepare('INSERT INTO dashboard_visualizations (dashboard_id, visualization_id, position) VALUES (?, ?, ?)').run(dashboardId, vizId1, JSON.stringify({ x: 0, y: 0, w: 12, h: 6 }));

      const viz3Result = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(userId, dataSourceId, 'Viz 3', ChartType.Pie, JSON.stringify({ title: 'Viz 3 Config' }));
      vizId3 = viz3Result.lastInsertRowid;
    });

    it('should update dashboard name and description', async () => {
      const updatedData = {
        name: 'Updated Dashboard Name',
        description: 'New Description',
      };

      const res = await request(app)
        .put(`/api/dashboards/${dashboardId}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Dashboard updated successfully');

      const dashboardInDb = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(dashboardId);
      expect(dashboardInDb.name).toEqual(updatedData.name);
      expect(dashboardInDb.description).toEqual(updatedData.description);
    });

    it('should update dashboard visualizations', async () => {
      const updatedData = {
        visualizations: [
          { id: vizId2, position: { x: 0, y: 0, w: 6, h: 4 } }, // Replaced vizId1 with vizId2
          { id: vizId3, position: { x: 6, y: 0, w: 6, h: 4 } }, // Added vizId3
        ],
      };

      const res = await request(app)
        .put(`/api/dashboards/${dashboardId}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Dashboard updated successfully');

      const dashboardVizInDb = db.prepare('SELECT visualization_id, position FROM dashboard_visualizations WHERE dashboard_id = ? ORDER BY visualization_id').all(dashboardId);
      expect(dashboardVizInDb).toHaveLength(2);
      expect(dashboardVizInDb[0].visualization_id).toEqual(vizId2);
      expect(JSON.parse(dashboardVizInDb[0].position)).toEqual(updatedData.visualizations[0].position);
      expect(dashboardVizInDb[1].visualization_id).toEqual(vizId3);
      expect(JSON.parse(dashboardVizInDb[1].position)).toEqual(updatedData.visualizations[1].position);
    });

    it('should remove all visualizations if empty array is provided', async () => {
      const updatedData = {
        visualizations: [],
      };

      const res = await request(app)
        .put(`/api/dashboards/${dashboardId}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      const dashboardVizInDb = db.prepare('SELECT * FROM dashboard_visualizations WHERE dashboard_id = ?').all(dashboardId);
      expect(dashboardVizInDb).toHaveLength(0);
    });

    it('should return 404 if dashboard not found or unauthorized', async () => {
      const res = await request(app)
        .put('/api/dashboards/nonexistent_id')
        .send({ name: 'Updated' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Dashboard not found or unauthorized');
    });

    it('should skip unauthorized visualizations during update', async () => {
      const otherUserId = 'other_user_id_for_update';
      db.prepare('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)').run(otherUserId, 'other_update_user', 'other_update@example.com', 'hashedpass', UserRole.User);
      const otherDataSourceResult = db.prepare('INSERT INTO data_sources (user_id, name, file_path, column_headers) VALUES (?, ?, ?, ?)').run(otherUserId, 'Other DS Update', 'dummy/path4.csv', '["G","H"]');
      const otherDataSourceId = otherDataSourceResult.lastInsertRowid;
      const otherVizResult = db.prepare('INSERT INTO visualizations (user_id, data_source_id, name, chart_type, config) VALUES (?, ?, ?, ?, ?)').run(otherUserId, otherDataSourceId, 'Other User Viz Update', ChartType.Bar, '{}');
      const otherVizId = otherVizResult.lastInsertRowid;

      const updatedData = {
        visualizations: [
          { id: vizId2, position: { x: 0, y: 0, w: 6, h: 4 } },
          { id: otherVizId, position: { x: 6, y: 0, w: 6, h: 4 } }, // Unauthorized visualization
        ],
      };

      const res = await request(app)
        .put(`/api/dashboards/${dashboardId}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(200);
      const dashboardVizInDb = db.prepare('SELECT visualization_id FROM dashboard_visualizations WHERE dashboard_id = ?').all(dashboardId);
      expect(dashboardVizInDb).toHaveLength(1); // Only vizId2 should be added
      expect(dashboardVizInDb[0].visualization_id).toEqual(vizId2);
    });
  });

  describe('DELETE /api/dashboards/:id', () => {
    let dashboardId: string;
    beforeEach(() => {
      const dashboardResult = db.prepare('INSERT INTO dashboards (user_id, name) VALUES (?, ?)').run(userId, 'Dashboard to Delete');
      dashboardId = dashboardResult.lastInsertRowid;
      db.prepare('INSERT INTO dashboard_visualizations (dashboard_id, visualization_id, position) VALUES (?, ?, ?)').run(dashboardId, vizId1, '{}');
    });

    it('should delete a dashboard and its associated visualizations links', async () => {
      const res = await request(app).delete(`/api/dashboards/${dashboardId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Dashboard deleted successfully');

      const dashboardInDb = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(dashboardId);
      expect(dashboardInDb).toBeUndefined();

      const dashboardVizInDb = db.prepare('SELECT * FROM dashboard_visualizations WHERE dashboard_id = ?').all(dashboardId);
      expect(dashboardVizInDb).toHaveLength(0);
    });

    it('should return 404 if dashboard not found or unauthorized', async () => {
      const res = await request(app).delete('/api/dashboards/nonexistent_id');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Dashboard not found or unauthorized');
    });
  });
});
```