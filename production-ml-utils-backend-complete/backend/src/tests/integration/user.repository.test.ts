```typescript
import { AppDataSource } from '../../database';
import { User } from '../../modules/users/user.entity';
import { UserRepository } from '../../modules/users/user.repository';
import { AppError } from '../../utils/appError';
import bcrypt from 'bcryptjs';

describe('UserRepository Integration Tests', () => {
  let userRepository: UserRepository;
  let testUser: User;

  beforeAll(async () => {
    await AppDataSource.initialize();
    userRepository = new UserRepository();
    // Clear users table before tests to ensure a clean state
    await AppDataSource.getRepository(User).delete({});
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should create a new user and hash password', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123',
      role: 'user',
    };

    const createdUser = await userRepository.create(userData);

    expect(createdUser).toBeDefined();
    expect(createdUser.id).toBeDefined();
    expect(createdUser.email).toBe('test@example.com');
    // Ensure password is hashed by checking if it's not the plain text
    expect(await bcrypt.compare(userData.password, createdUser.password)).toBe(true);
    expect(createdUser.role).toBe('user');

    testUser = createdUser; // Save for subsequent tests
  });

  it('should find a user by ID', async () => {
    const foundUser = await userRepository.findById(testUser.id);
    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe(testUser.email);
  });

  it('should find a user by email', async () => {
    const foundUser = await userRepository.findByEmail(testUser.email);
    expect(foundUser).toBeDefined();
    expect(foundUser?.id).toBe(testUser.id);
    // password should be selected for findByEmail
    expect(foundUser?.password).toBeDefined();
  });

  it('should return null if user by ID not found', async () => {
    const foundUser = await userRepository.findById('non-existent-uuid');
    expect(foundUser).toBeNull();
  });

  it('should return null if user by email not found', async () => {
    const foundUser = await userRepository.findByEmail('nonexistent@example.com');
    expect(foundUser).toBeNull();
  });

  it('should update a user', async () => {
    const updatedName = 'Updated Test User';
    const updatedUser = await userRepository.update(testUser.id, { name: updatedName });

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.name).toBe(updatedName);
    // Verify changes are persisted
    const fetchedUser = await userRepository.findById(testUser.id);
    expect(fetchedUser?.name).toBe(updatedName);
  });

  it('should throw AppError when trying to update non-existent user', async () => {
    await expect(userRepository.update('non-existent-uuid', { name: 'New Name' })).rejects.toThrow(
      new AppError('User not found', 404)
    );
  });

  it('should get all users', async () => {
    const users = await userRepository.findAll();
    expect(users).toBeDefined();
    expect(users.length).toBeGreaterThanOrEqual(1); // At least our test user
  });

  it('should delete a user', async () => {
    const newUser = await userRepository.create({
      name: 'User to delete',
      email: 'delete@example.com',
      password: 'deletepassword',
      role: 'user',
    });

    await userRepository.delete(newUser.id);
    const foundUser = await userRepository.findById(newUser.id);
    expect(foundUser).toBeNull();
  });

  it('should throw AppError when trying to delete non-existent user', async () => {
    await expect(userRepository.delete('non-existent-uuid')).rejects.toThrow(
      new AppError('User not found', 404)
    );
  });
});
```