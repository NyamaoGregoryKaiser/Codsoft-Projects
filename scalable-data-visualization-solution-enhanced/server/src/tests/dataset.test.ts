```typescript
import request from 'supertest';
import app from '../app';
import { AppDataSource } from '../config/db';
import { User, UserRole } from '../models/User';
import { Dataset, FileType } from '../models/Dataset';
import { config } from '../config/config';
import jwt from 'jsonwebtoken';
import path from 'path';

describe('Dataset API', () => {
  let user1: User;
  let user2: User;
  let adminUser: User;
  let user1AccessToken: string;
  let user2AccessToken: string;
  let adminAccessToken: string;
  let dataset1: Dataset;
  let dataset2: Dataset;
  let adminDataset: Dataset;

  beforeEach(async () => {
    const userRepo = AppDataSource.getRepository(User);
    user1 = userRepo.create({ username: 'user1', email: 'user1@example.com', password: 'password123', role: UserRole.USER });
    await user1.hashPassword();
    await userRepo.save(user1);

    user2 = userRepo.create({ username: 'user2', email: 'user2@example.com', password: 'password123', role: UserRole.USER });
    await user2.hashPassword();
    await userRepo.save(user2);

    adminUser = userRepo.create({ username: 'admin', email: 'admin@example.com', password: 'adminpassword', role: UserRole.ADMIN });
    await adminUser.hashPassword();
    await userRepo.save(adminUser);

    user1AccessToken = jwt.sign({ id: user1.id }, config.JWT_SECRET, { expiresIn: '1h' });
    user2AccessToken = jwt.sign({ id: user2.id }, config.JWT_SECRET, { expiresIn: '1h' });
    adminAccessToken = jwt.sign({ id: adminUser.id }, config.JWT_SECRET, { expiresIn: '1h' });

    const datasetRepo = AppDataSource.getRepository(Dataset);
    dataset1 = datasetRepo.create({
      name: 'User1 Sales Data',
      description: 'Sales data for user 1',
      fileType: FileType.CSV,
      data: 'col1,col2\n1,2\n3,4',
      user: user1,
    });
    await datasetRepo.save(dataset1);

    dataset2 = datasetRepo.create({
      name: 'User2 Product Info',
      description: 'Product information for user 2',
      fileType: FileType.JSON,
      data: '[{"id":1,"name":"Product A"},{"id":2,"name":"Product B"}]',
      user: user2,
    });
    await datasetRepo.save(dataset2);

    adminDataset = datasetRepo.create({
      name: 'Admin Global Data',
      description: 'Global data managed by admin',
      fileType: FileType.CSV,
      data: 'region,revenue\nNorth,1000\nSouth,2000',
      user: adminUser,
    });
    await datasetRepo.save(adminDataset);
  });

  describe('POST /api/datasets', () => {
    it('should upload a new CSV dataset for the authenticated user', async () => {
      const res = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .field('name', 'My New CSV Data')
        .field('description', 'A test CSV file')
        .attach('file', Buffer.from('header1,header2\nvalue1,value2'), 'test.csv');

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('Dataset uploaded successfully');
      expect(res.body.dataset).toHaveProperty('id');
      expect(res.body.dataset.name).toEqual('My New CSV Data');
      expect(res.body.dataset.fileType).toEqual('csv');
      expect(res.body.dataset.userId).toEqual(user1.id);
    });

    it('should upload a new JSON dataset for the authenticated user', async () => {
      const res = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .field('name', 'My New JSON Data')
        .field('description', 'A test JSON file')
        .attach('file', Buffer.from('[{"key":"value"}]'), 'test.json');

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('Dataset uploaded successfully');
      expect(res.body.dataset.fileType).toEqual('json');
    });

    it('should return 400 for unsupported file type', async () => {
      const res = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .field('name', 'Invalid File')
        .attach('file', Buffer.from('some content'), 'test.txt');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Unsupported file type. Only CSV and JSON are allowed.');
    });

    it('should return 400 if no file is uploaded', async () => {
      const res = await request(app)
        .post('/api/datasets')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .field('name', 'No File');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('No file uploaded');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/datasets')
        .field('name', 'Unauthorized')
        .attach('file', Buffer.from('some content'), 'test.csv');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/datasets', () => {
    it('should retrieve all datasets for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/datasets')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toEqual(dataset1.id);
      expect(res.body[0]).not.toHaveProperty('data'); // Data should not be included in list view
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/datasets');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/datasets/:id', () => {
    it('should retrieve a specific dataset by ID for the owner', async () => {
      const res = await request(app)
        .get(`/api/datasets/${dataset1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(dataset1.id);
      expect(res.body.name).toEqual(dataset1.name);
      expect(res.body).toHaveProperty('data', dataset1.data); // Data should be included in detail view
    });

    it('should return 404 for a non-existent dataset', async () => {
      const res = await request(app)
        .get('/api/datasets/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Dataset not found');
    });

    it('should return 403 if trying to access another user\'s dataset', async () => {
      const res = await request(app)
        .get(`/api/datasets/${dataset2.id}`) // dataset2 belongs to user2
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Unauthorized to access this dataset');
    });

    it('should allow admin to access any user\'s dataset', async () => {
      const res = await request(app)
        .get(`/api/datasets/${dataset1.id}`) // dataset1 belongs to user1
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(dataset1.id);
    });
  });

  describe('GET /api/datasets/:id/data', () => {
    it('should return parsed CSV data for the owner', async () => {
      const res = await request(app)
        .get(`/api/datasets/${dataset1.id}/data`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([{ col1: '1', col2: '2' }, { col1: '3', col2: '4' }]);
    });

    it('should return parsed JSON data for the owner', async () => {
      const res = await request(app)
        .get(`/api/datasets/${dataset2.id}/data`)
        .set('Authorization', `Bearer ${user2AccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([{ id: 1, name: 'Product A' }, { id: 2, name: 'Product B' }]);
    });

    it('should return 403 if trying to access another user\'s dataset data', async () => {
      const res = await request(app)
        .get(`/api/datasets/${dataset2.id}/data`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Unauthorized to access this dataset');
    });
  });

  describe('PUT /api/datasets/:id', () => {
    it('should update a dataset for the owner', async () => {
      const updatedName = 'Updated Sales Data';
      const res = await request(app)
        .put(`/api/datasets/${dataset1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ name: updatedName });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Dataset updated successfully');
      expect(res.body.dataset.name).toEqual(updatedName);
    });

    it('should return 403 if trying to update another user\'s dataset', async () => {
      const res = await request(app)
        .put(`/api/datasets/${dataset2.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ name: 'Attempted Update' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Unauthorized to update this dataset');
    });

    it('should allow admin to update any user\'s dataset', async () => {
      const updatedDescription = 'Admin changed description';
      const res = await request(app)
        .put(`/api/datasets/${dataset1.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ description: updatedDescription });

      expect(res.statusCode).toEqual(200);
      expect(res.body.dataset.description).toEqual(updatedDescription);
    });
  });

  describe('DELETE /api/datasets/:id', () => {
    it('should delete a dataset for the owner', async () => {
      const res = await request(app)
        .delete(`/api/datasets/${dataset1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Dataset deleted successfully');

      const check = await request(app)
        .get(`/api/datasets/${dataset1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`);
      expect(check.statusCode).toEqual(404);
    });

    it('should return 403 if trying to delete another user\'s dataset', async () => {
      const res = await request(app)
        .delete(`/api/datasets/${dataset2.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Unauthorized to delete this dataset');
    });

    it('should allow admin to delete any user\'s dataset via admin route', async () => {
      const res = await request(app)
        .delete(`/api/datasets/admin/${dataset1.id}`) // Using admin route
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Dataset deleted successfully');

      const check = await AppDataSource.getRepository(Dataset).findOne({ where: { id: dataset1.id } });
      expect(check).toBeNull();
    });

    it('should return 403 if non-admin tries to use admin delete route', async () => {
      const res = await request(app)
        .delete(`/api/datasets/admin/${dataset1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Forbidden: You do not have permission to perform this action');
    });
  });
});
```