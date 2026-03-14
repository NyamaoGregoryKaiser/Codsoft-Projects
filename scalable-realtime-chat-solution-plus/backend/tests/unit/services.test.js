```javascript
const authService = require('../../src/services/authService');
const roomService = require('../../src/services/roomService');
const messageService = require('../../src/services/messageService');
const { User, Room, Message, sequelize } = require('../../src/models');
const { APIError } = require('../../src/utils/apiErrors');
const { generateToken } = require('../../src/utils/jwt');

// Mock `bcryptjs` and `jsonwebtoken` for unit tests if not testing their actual logic
jest.mock('bcryptjs', () => ({
    hash: jest.fn(() => Promise.resolve('hashedpassword')),
    compare: jest.fn((plain, hashed) => Promise.resolve(plain === 'password123')),
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mockedToken'),
    verify: jest.fn(() => ({ id: 'mockUserId' })),
}));

// Mock logger to prevent excessive console output during tests
jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

describe('Auth Service', () => {
    beforeEach(async () => {
        await sequelize.sync({ force: true }); // Clean DB before each test
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('registerUser', () => {
        it('should register a new user and return user data with token', async () => {
            const userData = { username: 'reguser', email: 'reg@example.com', password: 'password123' };
            const { user, token } = await authService.registerUser(userData);

            expect(user).toBeDefined();
            expect(user.username).toBe(userData.username);
            expect(user.email).toBe(userData.email);
            expect(user.password).toBeUndefined(); // Password should be excluded
            expect(token).toBe('mockedToken');

            const savedUser = await User.findByPk(user.id);
            expect(savedUser).not.toBeNull();
            expect(savedUser.username).toBe(userData.username);
        });

        it('should throw APIError if user with email already exists', async () => {
            const userData = { username: 'test1', email: 'exist@example.com', password: 'password123' };
            await User.create(userData); // Pre-create user

            await expect(authService.registerUser({ username: 'test2', email: 'exist@example.com', password: 'password456' }))
                .rejects.toThrow(new APIError('User with this email already exists.', 409));
        });

        it('should throw APIError if user with username already exists', async () => {
            const userData = { username: 'existuser', email: 'test@example.com', password: 'password123' };
            await User.create(userData); // Pre-create user

            await expect(authService.registerUser({ username: 'existuser', email: 'test2@example.com', password: 'password456' }))
                .rejects.toThrow(new APIError('User with this username already exists.', 409));
        });

        it('should throw APIError for invalid input (e.g., short password - model validation)', async () => {
            await expect(authService.registerUser({ username: 'shortpass', email: 'valid@example.com', password: '123' }))
                .rejects.toThrow(new APIError('Password must be at least 6 characters long.', 400));
        });
    });

    describe('loginUser', () => {
        let user;
        beforeEach(async () => {
            const userData = { username: 'loginuser', email: 'login@example.com', password: 'password123' };
            user = await User.create(userData); // Create user for login tests
            // Manually set password for comparison mock to work
            user.password = 'hashedpassword';
        });

        it('should log in a user with valid credentials (email)', async () => {
            const { user: loggedInUser, token } = await authService.loginUser('login@example.com', 'password123');
            expect(loggedInUser).toBeDefined();
            expect(loggedInUser.username).toBe('loginuser');
            expect(token).toBe('mockedToken');
            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.status).toBe('online');
        });

        it('should log in a user with valid credentials (username)', async () => {
            const { user: loggedInUser, token } = await authService.loginUser('loginuser', 'password123');
            expect(loggedInUser).toBeDefined();
            expect(loggedInUser.email).toBe('login@example.com');
            expect(token).toBe('mockedToken');
        });

        it('should throw APIError for invalid password', async () => {
            await expect(authService.loginUser('login@example.com', 'wrongpassword'))
                .rejects.toThrow(new APIError('Invalid credentials.', 401));
        });

        it('should throw APIError for non-existent user', async () => {
            await expect(authService.loginUser('nonexistent@example.com', 'password123'))
                .rejects.toThrow(new APIError('Invalid credentials.', 401));
        });
    });

    describe('logoutUser', () => {
        let user;
        beforeEach(async () => {
            user = await User.create({ username: 'logoutuser', email: 'logout@example.com', password: 'password123', status: 'online' });
        });

        it('should update user status to offline', async () => {
            await authService.logoutUser(user.id);
            const updatedUser = await User.findByPk(user.id);
            expect(updatedUser.status).toBe('offline');
            expect(updatedUser.lastSeen).toBeDefined();
        });

        it('should do nothing if user not found', async () => {
            await authService.logoutUser('nonExistentId');
            const initialUser = await User.findByPk(user.id);
            expect(initialUser.status).toBe('online'); // Should remain unchanged
        });
    });
});

describe('Room Service', () => {
    let user1, user2;
    beforeEach(async () => {
        await sequelize.sync({ force: true });
        user1 = await User.create({ id: 'user1-id', username: 'roomuser1', email: 'room1@example.com', password: 'password123' });
        user2 = await User.create({ id: 'user2-id', username: 'roomuser2', email: 'room2@example.com', password: 'password123' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('createRoom', () => {
        it('should create a new room and add creator as member', async () => {
            const roomData = { name: 'New Public Room', description: 'desc', isPrivate: false };
            const room = await roomService.createRoom(roomData, user1.id);

            expect(room).toBeDefined();
            expect(room.name).toBe(roomData.name);
            expect(room.creatorId).toBe(user1.id);

            const members = await room.getMembers();
            expect(members.length).toBe(1);
            expect(members[0].id).toBe(user1.id);
        });

        it('should throw APIError for duplicate room name', async () => {
            await Room.create({ name: 'Existing Room', creatorId: user1.id });
            await expect(roomService.createRoom({ name: 'Existing Room' }, user1.id))
                .rejects.toThrow('name must be unique');
        });
    });

    describe('getAllRooms', () => {
        it('should return all public rooms', async () => {
            await Room.create({ name: 'Public Room 1', isPrivate: false, creatorId: user1.id });
            await Room.create({ name: 'Public Room 2', isPrivate: false, creatorId: user1.id });
            await Room.create({ name: 'Private Room', isPrivate: true, creatorId: user1.id });

            const rooms = await roomService.getAllRooms();
            expect(rooms.length).toBe(2);
            expect(rooms.some(r => r.name === 'Private Room')).toBe(false);
            expect(rooms.every(r => r.members !== undefined)).toBe(true);
        });
    });

    describe('getRoomById', () => {
        it('should retrieve a room by ID', async () => {
            const room = await Room.create({ name: 'Specific Room', creatorId: user1.id });
            const foundRoom = await roomService.getRoomById(room.id);
            expect(foundRoom.name).toBe('Specific Room');
        });

        it('should throw APIError if room not found', async () => {
            await expect(roomService.getRoomById('nonexistent-id'))
                .rejects.toThrow(new APIError('Room not found.', 404));
        });
    });

    describe('joinRoom', () => {
        let room;
        beforeEach(async () => {
            room = await Room.create({ id: 'room-join-id', name: 'Joinable Room', creatorId: user1.id });
        });

        it('should add a user to a room', async () => {
            await roomService.joinRoom(room.id, user2.id);
            const members = await room.getMembers();
            expect(members.some(m => m.id === user2.id)).toBe(true);
        });

        it('should throw APIError if user already a member', async () => {
            await roomService.joinRoom(room.id, user2.id); // Add first
            await expect(roomService.joinRoom(room.id, user2.id))
                .rejects.toThrow(new APIError('User is already a member of this room.', 409));
        });
    });

    describe('leaveRoom', () => {
        let room;
        beforeEach(async () => {
            room = await Room.create({ id: 'room-leave-id', name: 'Leavable Room', creatorId: user1.id });
            await room.addMember(user2); // Add user2 to room
        });

        it('should remove a user from a room', async () => {
            await roomService.leaveRoom(room.id, user2.id);
            const members = await room.getMembers();
            expect(members.some(m => m.id === user2.id)).toBe(false);
        });

        it('should throw APIError if user is not a member', async () => {
            await expect(roomService.leaveRoom(room.id, user1.id)) // User1 is creator but not a member via `addMember` for this test setup
                .rejects.toThrow(new APIError('User is not a member of this room.', 404));
        });
    });

    describe('getRoomMessages', () => {
        let room, msg1, msg2;
        beforeEach(async () => {
            room = await Room.create({ id: 'room-msg-id', name: 'Message Room', creatorId: user1.id });
            await room.addMember(user1); // Add user1 as member
            msg1 = await Message.create({ senderId: user1.id, roomId: room.id, content: 'First message' });
            await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamp
            msg2 = await Message.create({ senderId: user1.id, roomId: room.id, content: 'Second message' });
        });

        it('should retrieve messages for a room', async () => {
            const messages = await roomService.getRoomMessages(room.id);
            expect(messages.length).toBe(2);
            expect(messages[0].content).toBe('First message');
            expect(messages[1].content).toBe('Second message');
            expect(messages[0].sender.username).toBe(user1.username);
        });

        it('should apply limit and offset', async () => {
            const messages = await roomService.getRoomMessages(room.id, { limit: 1, offset: 1 });
            expect(messages.length).toBe(1);
            expect(messages[0].content).toBe('Second message');
        });
    });
});

describe('Message Service', () => {
    let user, room;
    beforeEach(async () => {
        await sequelize.sync({ force: true });
        user = await User.create({ id: 'msguser-id', username: 'msguser', email: 'msguser@example.com', password: 'password123' });
        room = await Room.create({ id: 'msgroom-id', name: 'Msg Room', creatorId: user.id });
        await room.addMember(user); // Add user to room to allow sending messages
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('sendMessage', () => {
        it('should send a new message successfully', async () => {
            const content = 'Hello from service';
            const message = await messageService.sendMessage(user.id, room.id, content);

            expect(message).toBeDefined();
            expect(message.content).toBe(content);
            expect(message.senderId).toBe(user.id);
            expect(message.roomId).toBe(room.id);
            expect(message.sender.username).toBe(user.username); // Eager loaded sender
        });

        it('should throw APIError if sender not found', async () => {
            await expect(messageService.sendMessage('non-existent-user', room.id, 'content'))
                .rejects.toThrow(new APIError('Sender not found.', 404));
        });

        it('should throw APIError if room not found', async () => {
            await expect(messageService.sendMessage(user.id, 'non-existent-room', 'content'))
                .rejects.toThrow(new APIError('Room not found.', 404));
        });

        it('should throw APIError if sender is not a member of a private room', async () => {
            const privateRoom = await Room.create({ id: 'private-room-id', name: 'Private Chat', isPrivate: true, creatorId: user.id });
            const nonMemberUser = await User.create({ id: 'nonmember-id', username: 'nonmember', email: 'nonmember@example.com', password: 'password123' });

            await expect(messageService.sendMessage(nonMemberUser.id, privateRoom.id, 'secret message'))
                .rejects.toThrow(new APIError('You must join this room to send messages.', 403));
        });

        it('should throw APIError for empty content', async () => {
            await expect(messageService.sendMessage(user.id, room.id, ''))
                .rejects.toThrow(new APIError('Message content cannot be empty.', 400));
        });
    });

    describe('getMessagesInRoom', () => {
        let msg1, msg2;
        beforeEach(async () => {
            msg1 = await Message.create({ senderId: user.id, roomId: room.id, content: 'Msg 1', createdAt: new Date(Date.now() - 2000) });
            msg2 = await Message.create({ senderId: user.id, roomId: room.id, content: 'Msg 2', createdAt: new Date(Date.now() - 1000) });
        });

        it('should retrieve messages in chronological order', async () => {
            const messages = await messageService.getMessagesInRoom(room.id);
            expect(messages.length).toBe(2);
            expect(messages[0].content).toBe('Msg 1');
            expect(messages[1].content).toBe('Msg 2');
        });

        it('should apply limit and offset correctly', async () => {
            const messages = await messageService.getMessagesInRoom(room.id, { limit: 1, offset: 1 });
            expect(messages.length).toBe(1);
            expect(messages[0].content).toBe('Msg 2');
        });
    });
});
```