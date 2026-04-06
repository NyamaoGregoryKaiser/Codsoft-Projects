const AuthService = require('../../../src/services/auth.service');
const User = require('../../../src/models/user.model');
const bcryptUtil = require('../../../src/utils/bcrypt');
const jwtUtil = require('../../../src/utils/jwt');
const { UnauthorizedError, ConflictError } = require('../../../src/utils/errorHandler');

// Mock User model and utility functions
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/utils/bcrypt');
jest.mock('../../../src/utils/jwt');

describe('AuthService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', password: 'hashedpassword', role: 'user' };
        const mockToken = 'mock-jwt-token';

        it('should successfully register a new user', async () => {
            User.findByUsername.mockResolvedValue(null);
            User.findByEmail.mockResolvedValue(null);
            bcryptUtil.hashPassword.mockResolvedValue('hashedpassword');
            User.create.mockResolvedValue(mockUser);
            jwtUtil.generateToken.mockReturnValue(mockToken);

            const result = await AuthService.register('testuser', 'test@example.com', 'password123');

            expect(User.findByUsername).toHaveBeenCalledWith('testuser');
            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(bcryptUtil.hashPassword).toHaveBeenCalledWith('password123');
            expect(User.create).toHaveBeenCalledWith({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword'
            });
            expect(jwtUtil.generateToken).toHaveBeenCalledWith({
                id: mockUser.id,
                username: mockUser.username,
                role: mockUser.role
            });
            expect(result).toEqual({
                user: { id: mockUser.id, username: mockUser.username, email: mockUser.email, role: mockUser.role },
                token: mockToken
            });
        });

        it('should throw ConflictError if username already exists', async () => {
            User.findByUsername.mockResolvedValueOnce({ id: 2, username: 'testuser' });

            await expect(AuthService.register('testuser', 'new@example.com', 'password123'))
                .rejects.toThrow(ConflictError);
            expect(User.findByUsername).toHaveBeenCalledWith('testuser');
            expect(User.findByEmail).not.toHaveBeenCalled(); // Should short-circuit
            expect(User.create).not.toHaveBeenCalled();
        });

        it('should throw ConflictError if email already exists', async () => {
            User.findByUsername.mockResolvedValue(null);
            User.findByEmail.mockResolvedValueOnce({ id: 3, email: 'test@example.com' });

            await expect(AuthService.register('anotheruser', 'test@example.com', 'password123'))
                .rejects.toThrow(ConflictError);
            expect(User.findByUsername).toHaveBeenCalledWith('anotheruser');
            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(User.create).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', password: 'hashedpassword', role: 'user' };
        const mockToken = 'mock-jwt-token';

        it('should successfully log in a user with valid credentials', async () => {
            User.findByUsername.mockResolvedValue(mockUser);
            bcryptUtil.comparePassword.mockResolvedValue(true);
            jwtUtil.generateToken.mockReturnValue(mockToken);

            const result = await AuthService.login('testuser', 'password123');

            expect(User.findByUsername).toHaveBeenCalledWith('testuser');
            expect(bcryptUtil.comparePassword).toHaveBeenCalledWith('password123', 'hashedpassword');
            expect(jwtUtil.generateToken).toHaveBeenCalledWith({
                id: mockUser.id,
                username: mockUser.username,
                role: mockUser.role
            });
            expect(result).toEqual({
                user: { id: mockUser.id, username: mockUser.username, email: mockUser.email, role: mockUser.role },
                token: mockToken
            });
        });

        it('should throw UnauthorizedError if user not found', async () => {
            User.findByUsername.mockResolvedValue(null);

            await expect(AuthService.login('nonexistent', 'password123'))
                .rejects.toThrow(UnauthorizedError);
            expect(User.findByUsername).toHaveBeenCalledWith('nonexistent');
            expect(bcryptUtil.comparePassword).not.toHaveBeenCalled();
        });

        it('should throw UnauthorizedError if password is invalid', async () => {
            User.findByUsername.mockResolvedValue(mockUser);
            bcryptUtil.comparePassword.mockResolvedValue(false);

            await expect(AuthService.login('testuser', 'wrongpassword'))
                .rejects.toThrow(UnauthorizedError);
            expect(User.findByUsername).toHaveBeenCalledWith('testuser');
            expect(bcryptUtil.comparePassword).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
            expect(jwtUtil.generateToken).not.toHaveBeenCalled();
        });
    });
});