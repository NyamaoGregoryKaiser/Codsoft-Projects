import { AuthService } from '../../src/services/AuthService';
import { UserRepository } from '../../src/repositories/UserRepository';
import { CustomError } from '../../src/middlewares/errorHandler';
import { User, UserRole } from '../../src/entities/User';
import * as jwtHelper from '../../src/utils/jwtHelper';

// Mock UserRepository and jwtHelper
jest.mock('../../src/repositories/UserRepository');
jest.mock('../../src/utils/jwtHelper');

const mockUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;
const mockGenerateToken = jwtHelper.generateToken as jest.Mock;

describe('AuthService', () => {
  let authService: AuthService;
  let testAdminUser: User;
  let testEditorUser: User;

  beforeAll(() => {
    authService = new AuthService();
    testAdminUser = new User();
    testAdminUser.id = 'admin-id';
    testAdminUser.email = 'admin@test.com';
    testAdminUser.password = 'hashedPassword'; // Placeholder
    testAdminUser.role = UserRole.ADMIN;
    testAdminUser.isActive = true;

    testEditorUser = new User();
    testEditorUser.id = 'editor-id';
    testEditorUser.email = 'editor@test.com';
    testEditorUser.password = 'hashedPassword';
    testEditorUser.role = UserRole.EDITOR;
    testEditorUser.isActive = true;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateToken.mockReturnValue('mockToken');
  });

  // --- Register Tests ---
  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(testEditorUser);
      jest.spyOn(testEditorUser, 'hashPassword').mockResolvedValue(undefined);

      const result = await authService.register({
        email: 'new@user.com',
        password: 'password123',
        role: UserRole.VIEWER,
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@user.com');
      expect(testEditorUser.hashPassword).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'mockToken');
      expect(result.user.email).toBe('new@user.com');
      expect(result.user.role).toBe(UserRole.VIEWER);
    });

    it('should throw CustomError if user with email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(testEditorUser);

      await expect(
        authService.register({ email: 'editor@test.com', password: 'password123' })
      ).rejects.toThrow(CustomError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('editor@test.com');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  // --- Login Tests ---
  describe('login', () => {
    it('should log in a user successfully', async () => {
      jest.spyOn(testEditorUser, 'comparePassword').mockResolvedValue(true);
      mockUserRepository.findByEmail.mockResolvedValue(testEditorUser);

      const result = await authService.login({ email: 'editor@test.com', password: 'password123' });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('editor@test.com');
      expect(testEditorUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(mockGenerateToken).toHaveBeenCalledWith(testEditorUser);
      expect(result).toHaveProperty('user', testEditorUser);
      expect(result).toHaveProperty('token', 'mockToken');
    });

    it('should throw CustomError for invalid email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login({ email: 'nonexistent@test.com', password: 'password123' })).rejects.toThrow(CustomError);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@test.com');
    });

    it('should throw CustomError for invalid password', async () => {
      jest.spyOn(testEditorUser, 'comparePassword').mockResolvedValue(false);
      mockUserRepository.findByEmail.mockResolvedValue(testEditorUser);

      await expect(authService.login({ email: 'editor@test.com', password: 'wrongpassword' })).rejects.toThrow(CustomError);
      expect(testEditorUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
    });

    it('should throw CustomError if user is inactive', async () => {
        const inactiveUser = { ...testEditorUser, isActive: false };
        mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);
        jest.spyOn(inactiveUser, 'comparePassword').mockResolvedValue(true);

        await expect(authService.login({ email: 'editor@test.com', password: 'password123' })).rejects.toThrow(CustomError);
        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('editor@test.com');
    });
  });

  // --- Get User Profile Tests ---
  describe('getUserProfile', () => {
    it('should return user profile excluding password', async () => {
      mockUserRepository.findOne.mockResolvedValue(testAdminUser);

      const userProfile = await authService.getUserProfile(testAdminUser.id);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: testAdminUser.id },
        select: ["id", "email", "role", "isActive", "createdAt", "updatedAt"]
      });
      expect(userProfile).toEqual(testAdminUser);
      expect(userProfile).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const userProfile = await authService.getUserProfile('non-existent-id');
      expect(userProfile).toBeNull();
    });
  });

  // --- Update User Tests ---
  describe('updateUser', () => {
    it('should update user email successfully', async () => {
        const userToUpdate = { ...testEditorUser };
        mockUserRepository.findOneBy.mockResolvedValue(userToUpdate);
        mockUserRepository.save.mockResolvedValue({ ...userToUpdate, email: 'updated@test.com' });

        const updatedUser = await authService.updateUser(userToUpdate.id, { email: 'updated@test.com' });

        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userToUpdate.id });
        expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'updated@test.com' }));
        expect(updatedUser?.email).toBe('updated@test.com');
    });

    it('should hash new password if provided', async () => {
        const userToUpdate = { ...testEditorUser };
        mockUserRepository.findOneBy.mockResolvedValue(userToUpdate);
        const hashPasswordSpy = jest.spyOn(userToUpdate, 'hashPassword').mockResolvedValue(undefined);
        mockUserRepository.save.mockResolvedValue({ ...userToUpdate, password: 'newHashedPassword' });

        await authService.updateUser(userToUpdate.id, { password: 'newSecurePassword' });

        expect(hashPasswordSpy).toHaveBeenCalled();
        expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw CustomError if user to update not found', async () => {
        mockUserRepository.findOneBy.mockResolvedValue(null);

        await expect(authService.updateUser('non-existent-id', { email: 'invalid@test.com' })).rejects.toThrow(CustomError);
        expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: 'non-existent-id' });
        expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  // --- Delete User Tests ---
  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
        mockUserRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

        await expect(authService.deleteUser(testEditorUser.id)).resolves.toBeUndefined();
        expect(mockUserRepository.delete).toHaveBeenCalledWith(testEditorUser.id);
    });

    it('should throw CustomError if user to delete not found', async () => {
        mockUserRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

        await expect(authService.deleteUser('non-existent-id')).rejects.toThrow(CustomError);
        expect(mockUserRepository.delete).toHaveBeenCalledWith('non-existent-id');
    });
  });
});