```javascript
const { sequelize, User, Room, Message } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('User Model', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true }); // Clear and sync DB for tests
    });

    afterEach(async () => {
        await User.destroy({ truncate: true }); // Clear users after each test
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should create a user with hashed password', async () => {
        const userData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        };
        const user = await User.create(userData);

        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.username).toBe(userData.username);
        expect(user.email).toBe(userData.email);
        expect(user.password).not.toBe(userData.password); // Password should be hashed
        expect(await bcrypt.compare(userData.password, user.password)).toBe(true);
        expect(user.status).toBe('offline');
    });

    it('should not create user with duplicate email', async () => {
        const userData = {
            username: 'user1',
            email: 'duplicate@example.com',
            password: 'password123',
        };
        await User.create(userData);

        await expect(User.create({
            username: 'user2',
            email: 'duplicate@example.com',
            password: 'anotherpassword',
        })).rejects.toThrow('email must be unique');
    });

    it('should not create user with invalid email', async () => {
        await expect(User.create({
            username: 'invaliduser',
            email: 'invalid-email',
            password: 'password123',
        })).rejects.toThrow('Invalid email address.');
    });

    it('should correctly compare password', async () => {
        const userData = {
            username: 'compareuser',
            email: 'compare@example.com',
            password: 'strongpassword',
        };
        const user = await User.create(userData);

        expect(await user.comparePassword('strongpassword')).toBe(true);
        expect(await user.comparePassword('wrongpassword')).toBe(false);
    });

    it('should update user password correctly', async () => {
        const user = await User.create({
            username: 'updatepass',
            email: 'updatepass@example.com',
            password: 'oldpassword',
        });

        await user.update({ password: 'newpassword' });
        expect(await user.comparePassword('newpassword')).toBe(true);
        expect(await user.comparePassword('oldpassword')).toBe(false);
    });
});

describe('Room Model', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true }); // Clear and sync DB for tests
    });

    afterEach(async () => {
        await Room.destroy({ truncate: true }); // Clear rooms after each test
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it('should create a room successfully', async () => {
        const roomData = {
            name: 'Test Room',
            description: 'A room for testing.',
            isPrivate: false,
        };
        const room = await Room.create(roomData);

        expect(room).toBeDefined();
        expect(room.id).toBeDefined();
        expect(room.name).toBe(roomData.name);
        expect(room.description).toBe(roomData.description);
        expect(room.isPrivate).toBe(roomData.isPrivate);
    });

    it('should not create room with duplicate name', async () => {
        await Room.create({ name: 'Unique Room 1' });

        await expect(Room.create({ name: 'Unique Room 1' })).rejects.toThrow('name must be unique');
    });

    it('should use default description if not provided', async () => {
        const room = await Room.create({ name: 'Default Desc Room' });
        expect(room.description).toBe('A general chat room.');
    });
});
```