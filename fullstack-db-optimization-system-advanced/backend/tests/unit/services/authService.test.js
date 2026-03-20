const authService = require('@services/authService');
const prisma = require('@config/db').default; // Access the mocked Prisma instance
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock bcrypt and jwt directly for isolation
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null); // User does not exist
      bcrypt.hash.mockResolvedValue('hashedpassword');
      prisma.user.create.mockResolvedValue({ id: 'user1', username: 'testuser', role: 'user' });
      jwt.sign.mockReturnValue('mocktoken');

      const result = await authService.registerUser('testuser', 'password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: 'testuser',
          password: 'hashedpassword',
          role: 'user',
        },
        select: { id: true, username: true, role: true },
      });
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user1' }, expect.any(String), expect.any(Object));
      expect(result).toEqual({
        user: { id: 'user1', username: 'testuser', role: 'user' },
        token: 'mocktoken',
      });
    });

    it('should throw an error if username already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existingId', username: 'testuser' }); // User exists

      await expect(authService.registerUser('testuser', 'password123'))
        .rejects.toThrow('User already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should log in a user successfully', async () => {
      const mockUser = { id: 'user1', username: 'testuser', password: 'hashedpassword', role: 'user' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true); // Passwords match
      jwt.sign.mockReturnValue('mocktoken');

      const result = await authService.loginUser('testuser', 'password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 'user1' }, expect.any(String), expect.any(Object));
      expect(result).toEqual({
        user: { id: 'user1', username: 'testuser', role: 'user' },
        token: 'mocktoken',
      });
    });

    it('should throw an error if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.loginUser('nonexistent', 'password123'))
        .rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw an error if password is incorrect', async () => {
      const mockUser = { id: 'user1', username: 'testuser', password: 'hashedpassword', role: 'user' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Passwords do not match

      await expect(authService.loginUser('testuser', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
});
```

#### `backend/tests/unit/services/queryService.test.js`
```javascript