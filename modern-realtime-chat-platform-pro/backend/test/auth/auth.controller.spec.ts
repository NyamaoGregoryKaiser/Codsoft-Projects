```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../../src/auth/decorators/current-user.decorator';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let configService: ConfigService;

  const mockResponse = {
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const mockUser = {
    id: 'user1',
    username: 'testuser',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            validateUserById: jest.fn(),
            jwtService: { decode: jest.fn() } // Mock jwtService for refreshTokens payload decoding
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NODE_ENV') return 'development';
              return 'test_value'; // For other config values not directly tested
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user and return the user object', async () => {
      const registerDto = { username: 'newuser', email: 'new@example.com', password: 'password123' };
      jest.spyOn(authService, 'register').mockResolvedValue(mockUser);

      const result = await controller.register(registerDto);
      expect(result).toEqual(mockUser);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should log in a user, set cookie and return tokens', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const loginResult = { user: mockUser, accessToken: 'testAccessToken', refreshToken: 'testRefreshToken' };
      jest.spyOn(authService, 'login').mockResolvedValue(loginResult);

      const result = await controller.login(loginDto, mockResponse);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'testRefreshToken', expect.any(Object));
      expect(result).toEqual({ user: mockUser, accessToken: 'testAccessToken' });
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens and set new refresh token cookie', async () => {
      const mockRequest = { cookies: { refreshToken: 'oldRefreshToken' } } as unknown as Request;
      const refreshResult = { accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' };
      jest.spyOn(authService['jwtService'], 'decode').mockReturnValue({ sub: mockUser.id });
      jest.spyOn(authService, 'refreshTokens').mockResolvedValue(refreshResult);

      const result = await controller.refreshTokens(mockRequest, mockResponse);

      expect(authService['jwtService'].decode).toHaveBeenCalledWith('oldRefreshToken');
      expect(authService.refreshTokens).toHaveBeenCalledWith(mockUser.id, 'oldRefreshToken');
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'newRefreshToken', expect.any(Object));
      expect(result).toEqual({ accessToken: 'newAccessToken' });
    });

    it('should throw UnauthorizedException if no refresh token in cookies', async () => {
      const mockRequest = { cookies: {} } as unknown as Request;

      await expect(controller.refreshTokens(mockRequest, mockResponse)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const mockRequest = { cookies: { refreshToken: 'invalidRefreshToken' } } as unknown as Request;
      jest.spyOn(authService['jwtService'], 'decode').mockReturnValue(null); // Simulate invalid token

      await expect(controller.refreshTokens(mockRequest, mockResponse)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should log out user and clear refresh token cookie', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      const result = await controller.logout(mockUser.id, mockResponse);

      expect(authService.logout).toHaveBeenCalledWith(mockUser.id);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile', () => {
      // Mock the @CurrentUser decorator value directly for controller testing
      const userDecoratorMock = CurrentUser();
      const user = userDecoratorMock.factory(mockUser, {
        switchToHttp: () => ({ getRequest: () => ({ user: mockUser }) }),
      } as any);

      const result = controller.getProfile(user);
      expect(result).toEqual(mockUser);
    });
  });
});
```