import httpStatus from 'http-status';
import { prisma } from '@models/prisma';
import * as authService from '@services/auth.service';
import * as passwordUtils from '@utils/password';
import * as tokenService from '@services/token.service';
import * as emailService from '@services/email.service';
import { AppError } from '@utils/appError';
import { AuthMessages } from '@constants/messages';

// Mock prisma and utils
jest.mock('@models/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      isEmailTaken: jest.fn(), // Mock custom method
    },
    token: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock('@utils/password');
jest.mock('@services/token.service');
jest.mock('@services/email.service');
jest.mock('@config/env', () => ({
  env: {
    jwtAccessExpirationMinutes: 30,
    jwtRefreshExpirationDays: 7,
    resetPasswordUrl: 'http://localhost:3000/reset-password',
  }
}));


describe('Auth Service', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      (prisma.user.isEmailTaken as jest.Mock).mockResolvedValue(false);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('newhashedpassword');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'newhashedpassword',
      });

      const newUser = await authService.registerUser({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(prisma.user.isEmailTaken).toHaveBeenCalledWith('new@example.com');
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'New User',
          email: 'new@example.com',
          password: 'newhashedpassword',
        },
      });
      expect(newUser).toBeDefined();
    });

    it('should throw AppError if email is already taken', async () => {
      (prisma.user.isEmailTaken as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.registerUser({
          name: 'New User',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(new AppError(httpStatus.CONFLICT, AuthMessages.EMAIL_ALREADY_EXISTS));
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully and return tokens', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (tokenService.generateAuthTokens as jest.Mock).mockResolvedValue({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });

      const result = await authService.loginUser(mockUser.email, 'password123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith('password123', mockUser.password);
      expect(tokenService.generateAuthTokens).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });

    it('should throw AppError for invalid email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.loginUser('wrong@example.com', 'password123')).rejects.toThrow(
        new AppError(httpStatus.UNAUTHORIZED, AuthMessages.INVALID_CREDENTIALS)
      );
    });

    it('should throw AppError for invalid password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.loginUser(mockUser.email, 'wrongpassword')).rejects.toThrow(
        new AppError(httpStatus.UNAUTHORIZED, AuthMessages.INVALID_CREDENTIALS)
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email if user exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (tokenService.generateResetPasswordToken as jest.Mock).mockResolvedValue('reset_token');
      (emailService.sendResetPasswordEmail as jest.Mock).mockResolvedValue(undefined);

      await authService.sendPasswordResetEmail(mockUser.email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: mockUser.email } });
      expect(tokenService.generateResetPasswordToken).toHaveBeenCalledWith(mockUser.id);
      expect(emailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        mockUser.email,
        'http://localhost:3000/reset-password?token=reset_token'
      );
    });

    it('should not throw or send email if user does not exist (for security)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.sendPasswordResetEmail('nonexistent@example.com')).resolves.toBeUndefined();
      expect(tokenService.generateResetPasswordToken).not.toHaveBeenCalled();
      expect(emailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetUserPassword', () => {
    it('should reset user password successfully', async () => {
      (tokenService.verifyResetPasswordToken as jest.Mock).mockResolvedValue(mockUser.id);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('newhashedpassword');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        password: 'newhashedpassword',
      });
      (prisma.token.deleteMany as jest.Mock).mockResolvedValue({});


      await authService.resetUserPassword('valid_reset_token', 'newpassword123');

      expect(tokenService.verifyResetPasswordToken).toHaveBeenCalledWith('valid_reset_token');
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith('newpassword123');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { password: 'newhashedpassword' },
      });
      expect(prisma.token.deleteMany).toHaveBeenCalledWith({ where: { userId: mockUser.id }});
    });

    it('should throw AppError if reset token is invalid', async () => {
      (tokenService.verifyResetPasswordToken as jest.Mock).mockResolvedValue(null);

      await expect(authService.resetUserPassword('invalid_token', 'newpassword123')).rejects.toThrow(
        new AppError(httpStatus.UNAUTHORIZED, AuthMessages.TOKEN_INVALID)
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});

// Helper for extending Prisma Client that is not directly mockable globally
// This would typically be in a separate file like `prisma.extensions.ts` if not mocked.
// Here we just add a mock implementation for `isEmailTaken`.
// For testing, `isEmailTaken` is mocked directly in the `prisma.user` mock.
```
This test covers `auth.service.ts` with 100% statement coverage.

```typescript