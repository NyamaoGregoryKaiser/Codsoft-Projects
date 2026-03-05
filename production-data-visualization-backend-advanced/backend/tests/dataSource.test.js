const supertest = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('../src/models/user');
const DataSource = require('../src/models/dataSource');
const { faker } = require('@faker-js/faker');
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

const request = supertest(app);

describe('DataSource API', () => {
  let token;
  let adminToken;
  let user;
  let admin;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    admin = await User.create({
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'adminpassword',
      role: 'admin',
    });
    adminToken = jwt.sign({ id: admin.id, role: admin.role }, config.jwtSecret, { expiresIn: '1h' });

    user = await User.create({
      username: 'testuser',
      email: 'user@test.com',
      password: 'userpassword',
      role: 'user',
    });
    token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1h' });
  });

  afterEach(async () => {
    await DataSource.destroy({ truncate: true });
  });

  afterAll(async () => {
    await User.destroy({ truncate: true }); // Clean up users
    await sequelize.close();
  });

  it('should create a new data source', async () => {
    const dataSourceData = {
      name: faker.lorem.words(3),
      type: 'mock_data',
      config: { data: [{ x: 1, y: 2 }] },
    };

    const res = await request
      .post('/api/data-sources')
      .set('Authorization', `Bearer ${token}`)
      .send(dataSourceData);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data.dataSource.name).toBe(dataSourceData.name);
    expect(res.body.data.dataSource.userId).toBe(user.id);
  });

  it('should get all data sources for a user', async () => {
    await DataSource.create({ name: 'Source 1', type: 'mock_data', config: {}, userId: user.id });
    await DataSource.create({ name: 'Source 2', type: 'mock_data', config: {}, userId: user.id });
    // Create one for admin to ensure segregation
    await DataSource.create({ name: 'Admin Source', type: 'mock_data', config: {}, userId: admin.id });


    const res = await request
      .get('/api/data-sources')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.results).toBe(2);
    expect(res.body.data.dataSources.some(ds => ds.name === 'Admin Source')).toBeFalsy();
  });

  it('should get a specific data source by ID', async () => {
    const newDataSource = await DataSource.create({
      name: 'Unique Source',
      type: 'mock_data',
      config: {},
      userId: user.id,
    });

    const res = await request
      .get(`/api/data-sources/${newDataSource.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data.dataSource.name).toBe('Unique Source');
  });

  it('should not get another user\'s data source', async () => {
    const anotherUser = await User.create({
      username: 'another',
      email: 'another@test.com',
      password: 'password',
    });
    const anotherDataSource = await DataSource.create({
      name: 'Another User Source',
      type: 'mock_data',
      config: {},
      userId: anotherUser.id,
    });

    const res = await request
      .get(`/api/data-sources/${anotherDataSource.id}`)
      .set('Authorization', `Bearer ${token}`); // User 'user' trying to access 'anotherUser's data

    expect(res.statusCode).toEqual(404);
  });

  it('admin should get all data sources', async () => {
    await DataSource.create({ name: 'Source 1', type: 'mock_data', config: {}, userId: user.id });
    await DataSource.create({ name: 'Admin Source', type: 'mock_data', config: {}, userId: admin.id });

    const res = await request
      .get('/api/data-sources')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.results).toBe(2);
    expect(res.body.data.dataSources.some(ds => ds.name === 'Source 1')).toBeTruthy();
    expect(res.body.data.dataSources.some(ds => ds.name === 'Admin Source')).toBeTruthy();
  });

  it('should update a data source', async () => {
    const newDataSource = await DataSource.create({
      name: 'Source to Update',
      type: 'mock_data',
      config: {},
      userId: user.id,
    });
    const updatedName = 'Updated Source Name';

    const res = await request
      .put(`/api/data-sources/${newDataSource.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: updatedName });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data.dataSource.name).toBe(updatedName);
  });

  it('should delete a data source', async () => {
    const newDataSource = await DataSource.create({
      name: 'Source to Delete',
      type: 'mock_data',
      config: {},
      userId: user.id,
    });

    const res = await request
      .delete(`/api/data-sources/${newDataSource.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(204);
    const checkDeleted = await DataSource.findByPk(newDataSource.id);
    expect(checkDeleted).toBeNull();
  });

  it('should get data from a mock_data source', async () => {
    const mockData = [{ year: 2020, value: 100 }, { year: 2021, value: 150 }];
    const newDataSource = await DataSource.create({
      name: 'Mock Data Source',
      type: 'mock_data',
      config: { data: mockData },
      userId: user.id,
    });

    const res = await request
      .get(`/api/data-sources/${newDataSource.id}/data`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data.data).toEqual(mockData);
  });

  it('should return 501 for unimplemented data source types', async () => {
    const newDataSource = await DataSource.create({
      name: 'API Source',
      type: 'api_endpoint', // This type is explicitly not fully implemented
      config: { apiUrl: 'http://test.com/api' },
      userId: user.id,
    });

    const res = await request
      .get(`/api/data-sources/${newDataSource.id}/data`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(501);
    expect(res.body.message).toContain('not fully implemented');
  });
});