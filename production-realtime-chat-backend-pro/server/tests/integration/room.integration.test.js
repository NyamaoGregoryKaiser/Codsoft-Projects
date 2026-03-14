```javascript
const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Room = require('../../models/Room');
const connectDB = require('../../config/db');
const logger = require('../../config/winston');

// Mock connectDB to connect to a test database instead of the main one
jest.mock('../../config/db', () => jest.fn(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/chatdb_test';
  await mongoose.connect(uri);
  logger.info(`Test MongoDB Connected: ${uri}`);
}));

// Mock logger to prevent actual logging during tests
logger.error = jest.fn();
logger.warn = jest.fn();
logger.info = jest.fn();
logger.debug = jest.fn();

let server;
let testUser1, testUser2;
let testUser1Token, testUser2Token;
let publicRoom, privateRoom;

beforeAll(async () => {
  require('dotenv').config({ path: './.env' });
  await connectDB();
  server = app.listen(5002); // Use a different port for tests
});

beforeEach(async () => {
  await User.deleteMany({});
  await Room.deleteMany({});

  testUser1 = await User.create({
    username: 'user1',
    email: 'user1@example.com',
    password: 'password123',
  });
  testUser2 = await User.create({
    username: 'user2',
    email: 'user2@example.com',
    password: 'password123',
  });

  publicRoom = await Room.create({
    name: 'General Chat',
    isPrivate: false,
    members: [testUser1._id, testUser2._id],
  });

  privateRoom = await Room.create({
    name: 'Secret Devs',
    isPrivate: true,
    members: [testUser1._id], // Only user1 is a member
  });

  // Update users with their room memberships
  await User.findByIdAndUpdate(testUser1._id, { $addToSet: { rooms: [publicRoom._id, privateRoom._id] } });
  await User.findByIdAndUpdate(testUser2._id, { $addToSet: { rooms: [publicRoom._id] } });

  testUser1Token = testUser1.getSignedJwtToken();
  testUser2Token = testUser2.getSignedJwtToken();
});

afterAll(async () => {
  await mongoose.connection.close();
  await server.close();
});

describe('Room Routes Integration Tests', () => {
  // @desc      Get all rooms for the authenticated user
  // @route     GET /api/v1/rooms
  describe('GET /api/v1/rooms', () => {
    it('should return all rooms the authenticated user is a member of', async () => {
      const res = await request(app)
        .get('/api/v1/rooms')
        .set('Authorization', `Bearer ${testUser1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toEqual(2); // user1 is in publicRoom and privateRoom
      expect(res.body.data.map(r => r._id.toString())).toEqual(
        expect.arrayContaining([publicRoom._id.toString(), privateRoom._id.toString()])
      );
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/v1/rooms');
      expect(res.statusCode).toEqual(401);
    });
  });

  // @desc      Get single room
  // @route     GET /api/v1/rooms/:id
  describe('GET /api/v1/rooms/:id', () => {
    it('should return a public room for a member', async () => {
      const res = await request(app)
        .get(`/api/v1/rooms/${publicRoom._id}`)
        .set('Authorization', `Bearer ${testUser1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'General Chat');
      expect(res.body.data.members.length).toEqual(2);
    });

    it('should return a private room for a member', async () => {
      const res = await request(app)
        .get(`/api/v1/rooms/${privateRoom._id}`)
        .set('Authorization', `Bearer ${testUser1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Secret Devs');
      expect(res.body.data.members.length).toEqual(1);
    });

    it('should return 403 for a private room if user is not a member', async () => {
      const res = await request(app)
        .get(`/api/v1/rooms/${privateRoom._id}`)
        .set('Authorization', `Bearer ${testUser2Token}`); // user2 is not in privateRoom

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Not authorized to access this private room');
    });

    it('should return 404 if room does not exist', async () => {
      const res = await request(app)
        .get(`/api/v1/rooms/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${testUser1Token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Room not found');
    });
  });

  // @desc      Create new room
  // @route     POST /api/v1/rooms
  describe('POST /api/v1/rooms', () => {
    it('should create a new public room and add creator as member', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${testUser1Token}`)
        .send({ name: 'New Public Room', isPrivate: false });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'New Public Room');
      expect(res.body.data.members).toEqual(expect.arrayContaining([testUser1._id.toString()]));

      const roomInDb = await Room.findById(res.body.data._id);
      expect(roomInDb).not.toBeNull();
      const user1InDb = await User.findById(testUser1._id);
      expect(user1InDb.rooms).toContainEqual(roomInDb._id);
    });

    it('should create a new private room with specified members', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${testUser1Token}`)
        .send({ name: 'Exclusive Chat', isPrivate: true, members: [testUser2._id.toString()] });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Exclusive Chat');
      expect(res.body.data.isPrivate).toBe(true);
      expect(res.body.data.members.length).toEqual(2); // creator + specified member
      expect(res.body.data.members).toEqual(expect.arrayContaining([testUser1._id.toString(), testUser2._id.toString()]));

      const roomInDb = await Room.findById(res.body.data._id);
      expect(roomInDb).not.toBeNull();
      const user1InDb = await User.findById(testUser1._id);
      expect(user1InDb.rooms).toContainEqual(roomInDb._id);
      const user2InDb = await User.findById(testUser2._id);
      expect(user2InDb.rooms).toContainEqual(roomInDb._id);
    });

    it('should return 400 if room name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${testUser1Token}`)
        .send({ isPrivate: false });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Please provide a room name');
    });

    it('should return 400 if room name already exists', async () => {
      const res = await request(app)
        .post('/api/v1/rooms')
        .set('Authorization', `Bearer ${testUser1Token}`)
        .send({ name: 'General Chat', isPrivate: false }); // Name already exists

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Room with this name already exists');
    });
  });

  // @desc      Update room
  // @route     PUT /api/v1/rooms/:id
  describe('PUT /api/v1/rooms/:id', () => {
    it('should update room name', async () => {
      const res = await request(app)
        .put(`/api/v1/rooms/${publicRoom._id}`)
        .set('Authorization', `Bearer ${testUser1Token}`)
        .send({ name: 'Updated General Chat' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Updated General Chat');

      const roomInDb = await Room.findById(publicRoom._id);
      expect(roomInDb.name).toEqual('Updated General Chat');
    });

    it('should return 404 if room to update does not exist', async () => {
      const res = await request(app)
        .put(`/api/v1/rooms/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${testUser1Token}`)
        .send({ name: 'Nonexistent Room' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Room not found');
    });
  });

  // @desc      Delete room
  // @route     DELETE /api/v1/rooms/:id
  describe('DELETE /api/v1/rooms/:id', () => {
    it('should delete a room and remove from members', async () => {
      const res = await request(app)
        .delete(`/api/v1/rooms/${publicRoom._id}`)
        .set('Authorization', `Bearer ${testUser1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const roomInDb = await Room.findById(publicRoom._id);
      expect(roomInDb).toBeNull();

      const user1InDb = await User.findById(testUser1._id);
      expect(user1InDb.rooms).not.toContainEqual(publicRoom._id);
      const user2InDb = await User.findById(testUser2._id);
      expect(user2InDb.rooms).not.toContainEqual(publicRoom._id);
    });

    it('should return 404 if room to delete does not exist', async () => {
      const res = await request(app)
        .delete(`/api/v1/rooms/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${testUser1Token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Room not found');
    });
  });

  // @desc      Add member to room
  // @route     PUT /api/v1/rooms/:id/join
  describe('PUT /api/v1/rooms/:id/join', () => {
    it('should allow a user to join a room', async () => {
      // Create a new room that user2 isn't in
      const newRoom = await Room.create({
        name: 'New Joinable Room',
        isPrivate: false,
        members: [testUser1._id],
      });

      const res = await request(app)
        .put(`/api/v1/rooms/${newRoom._id}/join`)
        .set('Authorization', `Bearer ${testUser2Token}`); // User2 joins

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.members).toEqual(expect.arrayContaining([testUser1._id.toString(), testUser2._id.toString()]));

      const roomInDb = await Room.findById(newRoom._id);
      expect(roomInDb.members).toContainEqual(testUser2._id);
      const user2InDb = await User.findById(testUser2._id);
      expect(user2InDb.rooms).toContainEqual(newRoom._id);
    });

    it('should return 400 if user is already a member', async () => {
      const res = await request(app)
        .put(`/api/v1/rooms/${publicRoom._id}/join`)
        .set('Authorization', `Bearer ${testUser1Token}`); // User1 is already a member

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('is already a member of room');
    });
  });

  // @desc      Remove member from room
  // @route     PUT /api/v1/rooms/:id/leave
  describe('PUT /api/v1/rooms/:id/leave', () => {
    it('should allow a user to leave a room', async () => {
      const res = await request(app)
        .put(`/api/v1/rooms/${publicRoom._id}/leave`)
        .set('Authorization', `Bearer ${testUser1Token}`); // User1 leaves

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.members).not.toContain(testUser1._id.toString());

      const roomInDb = await Room.findById(publicRoom._id);
      expect(roomInDb.members).not.toContainEqual(testUser1._id);
      const user1InDb = await User.findById(testUser1._id);
      expect(user1InDb.rooms).not.toContainEqual(publicRoom._id);
    });

    it('should return 400 if user is not a member', async () => {
      const res = await request(app)
        .put(`/api/v1/rooms/${privateRoom._id}/leave`) // User2 is not in privateRoom
        .set('Authorization', `Bearer ${testUser2Token}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('is not a member of room');
    });
  });
});
```