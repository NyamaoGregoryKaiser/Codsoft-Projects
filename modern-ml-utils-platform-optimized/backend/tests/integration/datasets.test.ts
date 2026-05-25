import request from 'supertest';
import app from '../../src/app';
import AppDataSource from '../../src/database/datasource';
import { User } from '../../src/modules/users/entities/User';
import { Dataset } from '../../src/modules/datasets/entities/Dataset';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import config from '../../src/config';
import { v4 as uuidv4 } from 'uuid';
import { clearCache } from '../../src/middleware/cache';

describe('Dataset Routes', () => {
  let userRepository: any;
  let datasetRepository: any;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    userRepository = AppDataSource.getRepository(User);
    datasetRepository = AppDataSource.getRepository(Dataset);
  });

  beforeEach(async () => {
    await datasetRepository.query('DELETE FROM datasets;');
    await userRepository.query('DELETE FROM users;');
    await clearCache(); // Clear all Redis cache before each test

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await userRepository.save(userRepository.create({
      id: uuidv4(),
      email: 'testuser@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
    }));
    authToken = jwt.sign({ id: testUser.id }, config.jwt.secret, { expiresIn: '1h' });
  });

  describe('POST /api/v1/datasets', () => {
    it('should create a new dataset for the authenticated user', async () => {
      const datasetData = {
        name: 'My New Dataset',
        description: 'A description of my new dataset.',
        filePath: 's3://bucket/path/to/data.csv',
        fileSizeBytes: 1024,
        mimeType: 'text/csv',
      };

      const res = await request(app)
        .post('/api/v1/datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(datasetData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(datasetData.name);
      expect(res.body.userId).toBe(testUser.id);
      expect(await datasetRepository.count({ where: { userId: testUser.id } })).toBe(1);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/v1/datasets')
        .send({
          name: 'Unauthorized Dataset',
          filePath: 's3://bucket/unauth.csv',
        })
        .expect(401);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/v1/datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Missing Path',
          // filePath is missing
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/datasets', () => {
    it('should return all datasets for the authenticated user', async () => {
      await datasetRepository.save(datasetRepository.create({
        name: 'Dataset 1', userId: testUser.id, filePath: 'path/1.csv'
      }));
      await datasetRepository.save(datasetRepository.create({
        name: 'Dataset 2', userId: testUser.id, filePath: 'path/2.csv'
      }));

      const res = await request(app)
        .get('/api/v1/datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].userId).toBe(testUser.id);
      expect(res.body[1].userId).toBe(testUser.id);
    });

    it('should return an empty array if no datasets exist for the user', async () => {
      const res = await request(app)
        .get('/api/v1/datasets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /api/v1/datasets/:datasetId', () => {
    let existingDataset: Dataset;

    beforeEach(async () => {
      existingDataset = await datasetRepository.save(datasetRepository.create({
        name: 'Existing Dataset',
        userId: testUser.id,
        filePath: 'path/existing.csv',
        description: 'Original description',
      }));
    });

    it('should return a specific dataset by ID for the owner', async () => {
      const res = await request(app)
        .get(`/api/v1/datasets/${existingDataset.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(existingDataset.id);
      expect(res.body.name).toBe('Existing Dataset');
    });

    it('should return 404 if dataset not found', async () => {
      await request(app)
        .get(`/api/v1/datasets/${uuidv4()}`) // Non-existent ID
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 if dataset belongs to another user', async () => {
      const anotherUser = await userRepository.save(userRepository.create({
        id: uuidv4(),
        email: 'another@example.com',
        password: await bcrypt.hash('password123', 10),
      }));
      const anotherDataset = await datasetRepository.save(datasetRepository.create({
        name: 'Another User Dataset',
        userId: anotherUser.id,
        filePath: 'path/another.csv',
      }));

      await request(app)
        .get(`/api/v1/datasets/${anotherDataset.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Should not find, as it's not owned by testUser
    });
  });

  describe('PATCH /api/v1/datasets/:datasetId', () => {
    let existingDataset: Dataset;

    beforeEach(async () => {
      existingDataset = await datasetRepository.save(datasetRepository.create({
        name: 'Existing Dataset',
        userId: testUser.id,
        filePath: 'path/existing.csv',
        description: 'Original description',
      }));
    });

    it('should update a specific dataset by ID for the owner', async () => {
      const updateData = {
        name: 'Updated Dataset Name',
        description: 'New description here.',
      };

      const res = await request(app)
        .patch(`/api/v1/datasets/${existingDataset.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.id).toBe(existingDataset.id);
      expect(res.body.name).toBe(updateData.name);
      expect(res.body.description).toBe(updateData.description);

      const updatedInDb = await datasetRepository.findOne({ where: { id: existingDataset.id } });
      expect(updatedInDb?.name).toBe(updateData.name);
      expect(updatedInDb?.description).toBe(updateData.description);
    });

    it('should return 404 if dataset not found for update', async () => {
      await request(app)
        .patch(`/api/v1/datasets/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Non-existent' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/datasets/:datasetId', () => {
    let existingDataset: Dataset;

    beforeEach(async () => {
      existingDataset = await datasetRepository.save(datasetRepository.create({
        name: 'Existing Dataset',
        userId: testUser.id,
        filePath: 'path/existing.csv',
        description: 'Original description',
      }));
    });

    it('should delete a specific dataset by ID for the owner', async () => {
      await request(app)
        .delete(`/api/v1/datasets/${existingDataset.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      expect(await datasetRepository.count({ where: { userId: testUser.id } })).toBe(0);
    });

    it('should return 404 if dataset not found for deletion', async () => {
      await request(app)
        .delete(`/api/v1/datasets/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});