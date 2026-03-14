```javascript
const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, Room, Message } = require('../../src/models');
const { generateToken } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

// Mock logger to prevent excessive console output during tests
jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

describe('API Integration Tests', () => {
    let testUser, adminUser, testUserToken, adminUserToken;
    let publicRoom, privateRoom;

    beforeAll(async () => {
        // Ensure database is clean and schema is updated before tests
        await sequelize.sync({ force: true });

        // Create test users
        testUser = await User.create({
            username: 'apitestuser',
            email: 'apitest@example.com',
            password: await bcrypt.hash('password123', 10),
            status: 'offline'
        });
        adminUser = await User.create({
            username: 'apiadmin',
            email: 'apiadmin@example.com',
            password: await bcrypt.hash('adminpassword', 10),
            status: 'online',
            // role: 'admin' // If roles were implemented
        });

        // Generate tokens
        testUserToken = generateToken(testUser.id);
        adminUserToken = generateToken(adminUser.id);

        // Create test rooms
        publicRoom = await Room.create({
            name: 'Public Test Room',
            description: 'A public room for API tests.',
            isPrivate: false,
            creatorId: adminUser.id,
        });
        privateRoom = await Room.create({
            name: 'Private Test Room',
            description: 'A private room for API tests.',
            isPrivate: true,
            creatorId: adminUser.id,
        });

        // Add users to rooms
        await publicRoom.addMember(testUser);
        await publicRoom.addMember(adminUser);
        await privateRoom.addMember(adminUser);
    }, 20000); // Increase timeout for beforeAll

    afterAll(async () => {
        await sequelize.close();
    });

    describe('Auth Routes', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    email: 'newuser@example.com',
                    password: 'password123',
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.username).toBe('newuser');
        });

        it('should login an existing user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'apitestuser',
                    password: 'password123',
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.username).toBe('apitestuser');
        });

        it('should return 401 for invalid login credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: 'apitestuser',
                    password: 'wrongpassword',
                });
            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toBe('Invalid credentials.');
        });

        it('should get authenticated user profile', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${testUserToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toBe(testUser.id);
            expect(res.body.username).toBe(testUser.username);
        });

        it('should update authenticated user profile', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    username: 'updatedtestuser',
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body.user.username).toBe('updatedtestuser');
            // Update local testUser object for subsequent tests
            testUser.username = 'updatedtestuser';
        });

        it('should logout authenticated user', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${testUserToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('Logged out successfully');
        });
    });

    describe('Room Routes', () => {
        it('should allow creating a new room', async () => {
            const res = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${adminUserToken}`)
                .send({
                    name: 'New Created Room',
                    description: 'A newly created room.',
                    isPrivate: false,
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body.room.name).toBe('New Created Room');
            expect(res.body.room.creatorId).toBe(adminUser.id);
        });

        it('should get all public rooms', async () => {
            const res = await request(app)
                .get('/api/rooms')
                .set('Authorization', `Bearer ${testUserToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1); // At least Public Test Room
            expect(res.body.some(r => r.name === 'Public Test Room')).toBe(true);
            expect(res.body.some(r => r.name === 'Private Test Room')).toBe(false);
        });

        it('should get a specific room by ID', async () => {
            const res = await request(app)
                .get(`/api/rooms/${publicRoom.id}`)
                .set('Authorization', `Bearer ${testUserToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.id).toBe(publicRoom.id);
            expect(res.body.name).toBe(publicRoom.name);
        });

        it('should allow a user to join a room', async () => {
            const newRoom = await Room.create({ name: 'Joinable Room', creatorId: adminUser.id });
            const res = await request(app)
                .post(`/api/rooms/${newRoom.id}/join`)
                .set('Authorization', `Bearer ${testUserToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('User joined room successfully.');
        });

        it('should allow a user to leave a room', async () => {
            const anotherRoom = await Room.create({ name: 'Leavable Room', creatorId: adminUser.id });
            await anotherRoom.addMember(testUser); // Make testUser a member
            const res = await request(app)
                .post(`/api/rooms/${anotherRoom.id}/leave`)
                .set('Authorization', `Bearer ${testUserToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toBe('User left room successfully.');
        });

        it('should get messages for a public room', async () => {
            await Message.create({ senderId: testUser.id, roomId: publicRoom.id, content: 'Hi public' });
            const res = await request(app)
                .get(`/api/rooms/${publicRoom.id}/messages`)
                .set('Authorization', `Bearer ${testUserToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body[0]).toHaveProperty('content');
            expect(res.body[0].sender.username).toBe(testUser.username);
        });

        it('should get messages for a private room if user is a member', async () => {
            await Message.create({ senderId: adminUser.id, roomId: privateRoom.id, content: 'Secret message' });
            const res = await request(app)
                .get(`/api/rooms/${privateRoom.id}/messages`)
                .set('Authorization', `Bearer ${adminUserToken}`); // Admin is a member
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body[0].content).toBe('Secret message');
        });

        it('should return 403 for getting messages from a private room if user is not a member', async () => {
            const res = await request(app)
                .get(`/api/rooms/${privateRoom.id}/messages`)
                .set('Authorization', `Bearer ${testUserToken}`); // Test user is not a member
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('You are not authorized to view messages in this private room.');
        });
    });

    describe('Message Routes', () => {
        it('should allow sending a message to a room', async () => {
            const res = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    roomId: publicRoom.id,
                    content: 'Hello from API message route!',
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body.message.content).toBe('Hello from API message route!');
            expect(res.body.message.sender.username).toBe(testUser.username);
        });

        it('should return 403 if user is not a member of the room', async () => {
            const newTempUser = await User.create({
                username: 'tempuser',
                email: 'temp@example.com',
                password: await bcrypt.hash('temp123', 10),
            });
            const newTempUserToken = generateToken(newTempUser.id);

            const res = await request(app)
                .post('/api/messages')
                .set('Authorization', `Bearer ${newTempUserToken}`)
                .send({
                    roomId: privateRoom.id, // tempUser is not a member of privateRoom
                    content: 'Attempting to send to private room',
                });
            expect(res.statusCode).toEqual(403);
            expect(res.body.message).toBe('You must join this room to send messages.');
        });
    });
});
```