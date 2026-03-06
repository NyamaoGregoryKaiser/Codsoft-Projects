import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(() => 'mockAccessToken'),
};

const mockUsersService = {
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null); // username and email not found
      mockUserRepository.create.mockReturnValue({ ...registerDto, id: 'some-uuid' });
      mockUserRepository.save.mockResolvedValue({ id: 'some-uuid', ...registerDto, passwordHash: 'hashedpassword', role: 'user' });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');
      jest.spyOn(authService, 'register').mockResolvedValue({
        id: 'some-uuid',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User); // Mock the service return type

      const result = await controller.register(registerDto);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('passwordHash'); // Should not return password hash
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException if username already exists', async () => {
      mockUserRepository.findOne.mockImplementation((options) => {
        if (options.where.username === registerDto.username) {
          return Promise.resolve({ username: registerDto.username });
        }
        return Promise.resolve(null);
      });
      
      jest.spyOn(authService, 'register').mockImplementation(() => {
        throw new ConflictException('Username already exists');
      });

      await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null); // username not found
      mockUserRepository.findOne.mockResolvedValueOnce({ email: registerDto.email }); // email found

      jest.spyOn(authService, 'register').mockImplementation(() => {
        throw new ConflictException('Email already exists');
      });

      await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testuser',
      password: 'password123',
    };
    const mockUser: User = {
      id: 'user-id',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTasks: [],
      comments: [],
      notifications: [],
      ownedProjects: [],
      reportedTasks: [],
    };

    it('should return an access token on successful login', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue({ accessToken: 'mockAccessToken' });

      const result = await controller.login(loginDto);
      expect(result).toEqual({ accessToken: 'mockAccessToken' });
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.username, loginDto.password);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);
      jest.spyOn(authService, 'login').mockImplementation(() => {
        throw new UnauthorizedException();
      });

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});