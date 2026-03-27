import { AuthService } from '../../src/modules/auth/auth.service';
import { RegisterUserDto, LoginUserDto } from '../../src/modules/auth/auth.dtos';
import { AppDataSource } from '../../src/db/data-source';
import { User, UserRole } from '../../src/modules/users/user.entity';
import { ApiError } from '../../src/utils/apiError';
import * as passwordUtils from '../../src/utils/password';
import * as jwtUtils from '../../src/utils/jwt';

// Mock the AppDataSource and its repository methods
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};

jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(mockUserRepository as any);

// Mock password and JWT utilities
jest.spyOn(passwordUtils, 'hashPassword').mockResolvedValue('hashedPassword123');
jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);
jest.spyOn(jwtUtils, 'generateToken').mockReturnValue('mockAccessToken');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    // Reset mocks before each test
    jest.clearAllMocks();
    mockUserRepository.createQueryBuilder.mockReturnThis();
    mockUserRepository.addSelect.mockReturnThis();
    mockUserRepository.where.mockReturnThis();
  });

  // --- Register Tests ---
  describe('register', () => {
    const registerDto: RegisterUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue({
        id: 'user-id-1',
        ...registerDto,
        password: 'hashedPassword123',
        role: UserRole.MEMBER,
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'user-id-1',
        ...registerDto,
        password: 'hashedPassword123',
        role: UserRole.MEMBER,
      });

      const result = await authService.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: [{ email: registerDto.email }, { username: registerDto.username }] });
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(registerDto.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        password: 'hashedPassword123',
        role: UserRole.MEMBER,
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(jwtUtils.generateToken).toHaveBeenCalledWith('user-id-1', UserRole.MEMBER);
      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        user: {
          id: 'user-id-1',
          username: registerDto.username,
          email: registerDto.email,
          role: UserRole.MEMBER,
        },
      });
    });

    it('should throw ApiError if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ email: registerDto.email }); // Existing user with same email

      await expect(authService.register(registerDto)).rejects.toThrow(new ApiError(409, 'User with this email already exists.'));
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ApiError if username already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ username: registerDto.username, email: 'another@example.com' }); // Existing user with same username

      await expect(authService.register(registerDto)).rejects.toThrow(new ApiError(409, 'User with this username already exists.'));
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should allow admin role registration if specified (and not blocked by other logic)', async () => {
      const adminRegisterDto: RegisterUserDto = {
        ...registerDto,
        role: UserRole.ADMIN,
      };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        id: 'admin-id-1',
        ...adminRegisterDto,
        password: 'hashedPassword123',
        role: UserRole.ADMIN,
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'admin-id-1',
        ...adminRegisterDto,
        password: 'hashedPassword123',
        role: UserRole.ADMIN,
      });

      const result = await authService.register(adminRegisterDto);
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.ADMIN }));
      expect(result.user.role).toBe(UserRole.ADMIN);
    });
  });

  // --- Login Tests ---
  describe('login', () => {
    const loginDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const mockUser: User = {
      id: 'user-id-1',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedPassword123',
      role: UserRole.MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdProjects: [],
      assignedTasks: [],
      createdTasks: []
    };

    it('should successfully log in a user with correct credentials', async () => {
      mockUserRepository.getOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockUserRepository.addSelect).toHaveBeenCalledWith('user.password');
      expect(mockUserRepository.where).toHaveBeenCalledWith('user.email = :email', { email: loginDto.email });
      expect(mockUserRepository.getOne).toHaveBeenCalled();
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtUtils.generateToken).toHaveBeenCalledWith(mockUser.id, mockUser.role);
      expect(result).toEqual({
        accessToken: 'mockAccessToken',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });

    it('should throw ApiError if user not found', async () => {
      mockUserRepository.getOne.mockResolvedValue(null); // User not found

      await expect(authService.login(loginDto)).rejects.toThrow(new ApiError(401, 'Invalid credentials.'));
      expect(passwordUtils.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw ApiError if password is incorrect', async () => {
      mockUserRepository.getOne.mockResolvedValue(mockUser);
      jest.spyOn(passwordUtils, 'comparePassword').mockResolvedValue(false); // Incorrect password

      await expect(authService.login(loginDto)).rejects.toThrow(new ApiError(401, 'Invalid credentials.'));
      expect(passwordUtils.comparePassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtUtils.generateToken).not.toHaveBeenCalled();
    });
  });
});