```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test_jwt_secret';
              if (key === 'JWT_EXPIRES_IN') return '1h';
              if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
              if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');
      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        ...mockUser,
        password: 'any_password_field_is_fine_here_as_it_is_selected_away',
      });

      const result = await service.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            username: 'newuser',
            email: 'new@example.com',
            password: 'hashedpassword',
          },
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          username: 'newuser',
          email: 'new@example.com',
        }),
      );
    });

    it('should throw BadRequestException if user with email already exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.register({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('accessToken').mockResolvedValueOnce('refreshToken');
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        user: { id: mockUser.id, username: mockUser.username, email: mockUser.email },
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });

    it('should throw UnauthorizedException for invalid credentials (user not found)', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid credentials (wrong password)', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens on successful refresh', async () => {
      const userWithRefreshToken = { ...mockUser, refreshToken: 'oldRefreshToken' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithRefreshToken);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({});
      jest.spyOn(jwtService, 'signAsync').mockResolvedValueOnce('newAccessToken').mockResolvedValueOnce('newRefreshToken');
      jest.spyOn(prisma.user, 'update').mockResolvedValue(userWithRefreshToken);

      const result = await service.refreshTokens(mockUser.id, 'oldRefreshToken');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('oldRefreshToken', { secret: 'test_refresh_secret' });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.refreshTokens('nonexistent', 'oldRefreshToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token does not match', async () => {
      const userWithRefreshToken = { ...mockUser, refreshToken: 'differentRefreshToken' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithRefreshToken);

      await expect(service.refreshTokens(mockUser.id, 'oldRefreshToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is invalid/expired', async () => {
      const userWithRefreshToken = { ...mockUser, refreshToken: 'oldRefreshToken' };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithRefreshToken);
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshTokens(mockUser.id, 'oldRefreshToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token for the user', async () => {
      jest.spyOn(prisma.user, 'updateMany').mockResolvedValue({ count: 1 });

      await service.logout(mockUser.id);

      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: mockUser.id, refreshToken: { not: null } },
        data: { refreshToken: null },
      });
    });
  });

  describe('validateUserById', () => {
    it('should return user if found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.validateUserById(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.validateUserById('nonexistent');
      expect(result).toBeNull();
    });
  });
});
```