import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AppLogger } from '../shared/logger/app-logger.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../shared/enums/roles.enum';

jest.mock('bcrypt'); // Mock bcrypt for password hashing/comparison

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'mockedAccessToken'),
          },
        },
        {
          provide: AppLogger,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            setContext: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    const hashedPassword = 'hashedPassword123';
    const newUser: User = {
      id: 'uuid1',
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      roles: [Role.User],
      createdAt: new Date(),
      updatedAt: new Date(),
      projects: [],
      assignedTasks: [],
      comments: [],
    };

    beforeAll(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    });

    it('should successfully register a new user', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.findByUsername as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue(newUser);

      const result = await service.register(registerUserDto);
      expect(result).toEqual(expect.objectContaining({ email: newUser.email, username: newUser.username }));
      expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({ password: hashedPassword }));
      expect(bcrypt.hash).toHaveBeenCalledWith(registerUserDto.password, 10);
    });

    it('should throw ConflictException if email already exists', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(newUser);
      await expect(service.register(registerUserDto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.findByUsername as jest.Mock).mockResolvedValue(newUser);
      await expect(service.register(registerUserDto)).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const hashedPassword = 'hashedPassword123';
    const existingUser: User = {
      id: 'uuid1',
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      roles: [Role.User],
      createdAt: new Date(),
      updatedAt: new Date(),
      projects: [],
      assignedTasks: [],
      comments: [],
    };

    it('should successfully login a user and return an access token', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginUserDto);
      expect(result).toEqual({ accessToken: 'mockedAccessToken' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: existingUser.username,
        sub: existingUser.id,
        roles: existingUser.roles,
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login(loginUserDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    const payload = { sub: 'uuid1', username: 'testuser', roles: [Role.User] };
    const existingUser: User = {
      id: 'uuid1',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword123',
      roles: [Role.User],
      createdAt: new Date(),
      updatedAt: new Date(),
      projects: [],
      assignedTasks: [],
      comments: [],
    };

    it('should return user if valid payload', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(existingUser);
      const result = await service.validateUser(payload);
      expect(result).toEqual(existingUser);
    });

    it('should return null if user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);
      const result = await service.validateUser(payload);
      expect(result).toBeNull();
    });
  });
});