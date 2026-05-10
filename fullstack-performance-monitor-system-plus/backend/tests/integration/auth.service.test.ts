import * as authService from '../../src/api/auth/auth.service';
import { prisma } from '../../src/database/prisma-client';
import { AppError } from '../../src/error';
import bcrypt from 'bcrypt';

describe('Auth Service Integration Tests', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      };
      const user = await authService.register(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');

      const foundUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(foundUser).toBeDefined();
      expect(await bcrypt.compare(userData.password, foundUser!.passwordHash)).toBe(true);
    });

    it('should throw an error if email already exists', async () => {
      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        passwordConfirm: 'password123'
      };
      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(
        expect.objectContaining({
          code: 'P2002' // Prisma unique constraint violation code
        })
      );
    });
  });

  describe('login', () => {
    let testUser: any;
    const userPassword = 'password123';

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(userPassword, 12);
      testUser = await prisma.user.create({
        data: {
          name: 'Login Test',
          email: 'login@example.com',
          passwordHash: hashedPassword,
        },
      });
    });

    it('should return a token and user on successful login', async () => {
      const { token, user } = await authService.login(testUser.email, userPassword);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe(testUser.email);
    });

    it('should throw AppError for incorrect password', async () => {
      await expect(authService.login(testUser.email, 'wrongpassword')).rejects.toThrow(
        new AppError('Incorrect email or password', 401)
      );
    });

    it('should throw AppError for non-existent email', async () => {
      await expect(authService.login('nonexistent@example.com', userPassword)).rejects.toThrow(
        new AppError('Incorrect email or password', 401)
      );
    });
  });
});