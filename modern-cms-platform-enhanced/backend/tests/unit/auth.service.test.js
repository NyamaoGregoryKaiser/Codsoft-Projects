```javascript
const authService = require('../../src/services/auth.service');
const { User } = require('../../src/models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../src/config/config');

// Mock User model and its methods
jest.mock('../../src/models', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn(),
        findByPk: jest.fn(),
    },
}));

// Mock bcrypt and jwt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- Register User Tests ---
    describe('registerUser', () => {
        it('should register a new user successfully with default role', async () => {
            User.findOne.mockResolvedValue(null); // User does not exist
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedPassword');
            const mockUser = {
                id: '123',
                username: 'testuser',
                email: 'test@example.com',
                role: 'viewer',
                save: jest.fn(),
            };
            User.create.mockResolvedValue(mockUser);

            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            const user = await authService.registerUser(userData);

            expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
            expect(User.findOne).toHaveBeenCalledWith({ where: { username: userData.username } });
            expect(User.create).toHaveBeenCalledWith({ ...userData, role: 'viewer' });
            expect(user).toEqual(mockUser);
        });

        it('should throw an error if email already exists', async () => {
            User.findOne.mockResolvedValue({ email: 'test@example.com' }); // User exists
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            await expect(authService.registerUser(userData)).rejects.toThrow('User with that email already exists.');
            expect(User.create).not.toHaveBeenCalled();
        });

        it('should throw an error if username already exists', async () => {
            User.findOne
                .mockResolvedValueOnce(null) // Email not found
                .mockResolvedValueOnce({ username: 'testuser' }); // Username found
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            await expect(authService.registerUser(userData)).rejects.toThrow('User with that username already exists.');
            expect(User.create).not.toHaveBeenCalled();
        });

        it('should throw a 400 error for Sequelize validation failure', async () => {
            User.findOne.mockResolvedValue(null);
            User.create.mockRejectedValue({
                name: 'SequelizeValidationError',
                errors: [{ message: 'Email is invalid' }]
            });

            const userData = {
                username: 'invaliduser',
                email: 'invalid-email',
                password: 'password123'
            };

            await expect(authService.registerUser(userData)).rejects.toMatchObject({
                message: 'Email is invalid',
                status: 400
            });
        });
    });

    // --- Login User Tests ---
    describe('loginUser', () => {
        it('should login a user successfully and return a token', async () => {
            const mockUser = {
                id: '123',
                email: 'test@example.com',
                password: 'hashedPassword',
                role: 'viewer',
                isActive: true,
                comparePassword: jest.fn().mockResolvedValue(true),
                save: jest.fn(),
            };
            User.findOne.mockResolvedValue(mockUser);
            jwt.sign.mockReturnValue('mockToken');

            const { user, token } = await authService.loginUser('test@example.com', 'password123');

            expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
            expect(mockUser.save).toHaveBeenCalled();
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUser.id, role: mockUser.role },
                config.jwtSecret,
                { expiresIn: config.jwtExpiresIn }
            );
            expect(user).toEqual(mockUser);
            expect(token).toBe('mockToken');
        });

        it('should throw an error for user not found', async () => {
            User.findOne.mockResolvedValue(null);

            await expect(authService.loginUser('nonexistent@example.com', 'password123')).rejects.toThrow('Invalid credentials.');
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should throw an error for incorrect password', async () => {
            const mockUser = {
                id: '123',
                email: 'test@example.com',
                password: 'hashedPassword',
                isActive: true,
                comparePassword: jest.fn().mockResolvedValue(false),
            };
            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.loginUser('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials.');
            expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
            expect(jwt.sign).not.toHaveBeenCalled();
        });

        it('should throw an error if account is inactive', async () => {
            const mockUser = {
                id: '123',
                email: 'test@example.com',
                password: 'hashedPassword',
                isActive: false, // Inactive user
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            User.findOne.mockResolvedValue(mockUser);

            await expect(authService.loginUser('test@example.com', 'password123')).rejects.toMatchObject({
                message: 'Your account is inactive. Please contact support.',
                status: 403
            });
            expect(jwt.sign).not.toHaveBeenCalled();
        });
    });
});
```