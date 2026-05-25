import request from 'supertest';
import app from '../../src/app';
import AppDataSource from '../../src/database/datasource';
import { User } from '../../src/modules/users/entities/User';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import config from '../../src/config';
import { v4 as uuidv4 } from 'uuid';

describe('Data Utilities Routes', () => {
  let userRepository: any;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    userRepository = AppDataSource.getRepository(User);
  });

  beforeEach(async () => {
    await userRepository.query('DELETE FROM users;');

    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await userRepository.save(userRepository.create({
      id: uuidv4(),
      email: 'utilityuser@example.com',
      password: hashedPassword,
      firstName: 'Utility',
      lastName: 'User',
    }));
    authToken = jwt.sign({ id: testUser.id }, config.jwt.secret, { expiresIn: '1h' });
  });

  describe('POST /api/v1/data-utilities/encode/one-hot', () => {
    it('should one-hot encode data for an authenticated user', async () => {
      const inputData = [
        { id: 1, color: 'red', value: 10 },
        { id: 2, color: 'blue', value: 20 },
        { id: 3, color: 'red', value: 15 },
      ];
      const column = 'color';

      const res = await request(app)
        .post('/api/v1/data-utilities/encode/one-hot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: inputData, column: column })
        .expect(200);

      expect(res.body).toHaveProperty('encodedData');
      expect(res.body.encodedData).toHaveLength(3);
      expect(res.body.encodedData[0]).toEqual(expect.objectContaining({
        id: 1, value: 10, color_red: 1, color_blue: 0,
      }));
      expect(res.body.encodedData[1]).toEqual(expect.objectContaining({
        id: 2, value: 20, color_red: 0, color_blue: 1,
      }));
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/v1/data-utilities/encode/one-hot')
        .send({ data: [{ color: 'red' }], column: 'color' })
        .expect(401);
    });

    it('should return 400 for invalid input data', async () => {
      await request(app)
        .post('/api/v1/data-utilities/encode/one-hot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: [], column: 'color' }) // Empty data
        .expect(400);

      await request(app)
        .post('/api/v1/data-utilities/encode/one-hot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: [{ color: 'red' }], column: '' }) // Empty column
        .expect(400);

      await request(app)
        .post('/api/v1/data-utilities/encode/one-hot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: null, column: 'color' }) // Null data
        .expect(400);
    });
  });

  describe('POST /api/v1/data-utilities/scale/min-max', () => {
    it('should min-max scale data for an authenticated user', async () => {
      const inputData = [
        { id: 1, feature: 10, category: 'A' },
        { id: 2, feature: 20, category: 'B' },
        { id: 3, feature: 5, category: 'C' },
      ];
      const column = 'feature'; // min=5, max=20

      const res = await request(app)
        .post('/api/v1/data-utilities/scale/min-max')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: inputData, column: column })
        .expect(200);

      expect(res.body).toHaveProperty('scaledData');
      expect(res.body.scaledData).toHaveLength(3);
      // (10-5)/(20-5) = 5/15 = 0.333...
      expect(res.body.scaledData[0].feature_scaled).toBeCloseTo(1 / 3);
      // (20-5)/(20-5) = 15/15 = 1
      expect(res.body.scaledData[1].feature_scaled).toBeCloseTo(1);
      // (5-5)/(20-5) = 0/15 = 0
      expect(res.body.scaledData[2].feature_scaled).toBeCloseTo(0);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/v1/data-utilities/scale/min-max')
        .send({ data: [{ value: 10 }], column: 'value' })
        .expect(401);
    });

    it('should return 400 for non-numeric column data', async () => {
      const inputData = [
        { id: 1, feature: 'text' },
        { id: 2, feature: 'another text' },
      ];
      const column = 'feature';

      await request(app)
        .post('/api/v1/data-utilities/scale/min-max')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: inputData, column: column })
        .expect(400);
    });

    it('should return 400 for empty data or column', async () => {
      await request(app)
        .post('/api/v1/data-utilities/scale/min-max')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: [], column: 'feature' })
        .expect(400);

      await request(app)
        .post('/api/v1/data-utilities/scale/min-max')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ data: [{ feature: 10 }], column: '' })
        .expect(400);
    });
  });
});