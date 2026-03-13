```typescript
import { UserService } from '../../src/users/user.service';
import { User } from '../../src/users/user.entity';
import { AppDataSource } from '../../src/data-source';
import { HttpError } from '../../src/shared/http-error';
import bcrypt from 'bcrypt';
import { UserRole } from '../../src/shared/enums';

// Mock the AppDataSource repository for unit tests
const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

// Mock the AppDataSource.getRepository method
jest.spyOn(AppDataSource, 'getRepository').mockReturnValue(mockUserRepository as any);

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: '1', username: 'testuser', password: 'hashedpassword', role: UserRole.USER });
      mockUserRepository.save.mockResolvedValue({ id: '1', username: 'testuser', password: 'hashedpassword', role: UserRole.USER });

      const user = await userService.createUser('testuser', 'password123', UserRole.USER);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ username: 'testuser' });
      expect(mockUserRepository.create).toHaveBeenCalledWith({ username: 'testuser', password: expect.any(String), role: UserRole.USER });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(user).toHaveProperty('id', '1');
      expect(user).toHaveProperty('username', 'testuser');
      expect(user).toHaveProperty('role', UserRole.USER);
    });

    it('should throw HttpError if user already exists', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(new User());

      await expect(userService.createUser('existinguser', 'password123', UserRole.USER)).rejects.toThrow(HttpError);
      await expect(userService.createUser('existinguser', 'password123', UserRole.USER)).rejects.toHaveProperty('statusCode', 409);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByUsername', () => {
    it('should find a user by username', async () => {
      const mockUser = { id: '1', username: 'testuser', password: 'hashedpassword', role: UserRole.USER };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const user = await userService.findByUsername('testuser');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' }, select: ['id', 'username', 'password', 'role'] });
      expect(user).toEqual(mockUser);
    });

    it('should return null if user not found by username', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const user = await userService.findByUsername('nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      const mockUser = { id: '1', username: 'testuser', role: UserRole.USER };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const user = await userService.findById('1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' }, select: ['id', 'username', 'role'] });
      expect(user).toEqual(mockUser);
    });

    it('should return null if user not found by ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const user = await userService.findById('nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('getUsers', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', role: UserRole.USER, createdAt: new Date() },
        { id: '2', username: 'user2', role: UserRole.ADMIN, createdAt: new Date() },
      ];
      mockUserRepository.find.mockResolvedValue(mockUsers);

      const users = await userService.getUsers();

      expect(mockUserRepository.find).toHaveBeenCalledWith({ select: ['id', 'username', 'role', 'createdAt'] });
      expect(users).toEqual(mockUsers);
      expect(users.length).toBe(2);
    });

    it('should return an empty array if no users exist', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const users = await userService.getUsers();

      expect(users).toEqual([]);
    });
  });
});
```