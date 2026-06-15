import * as userService from '../../src/services/user.service';
import { PrismaClient, UserRole } from '@prisma/client';
import { ApiError } from '../../src/middlewares/error.middleware';

const prisma = new PrismaClient();

describe('User Service', () => {
  let testUser: any;

  beforeEach(async () => {
    // Clear users, create a temporary user for tests
    await prisma.user.deleteMany();
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a new user', async () => {
    const newUser = {
      email: 'newuser@example.com',
      password: 'newhashedpassword',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.USER,
    };
    const createdUser = await userService.createUser(newUser);
    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(newUser.email);
    expect(createdUser.password).toBe(newUser.password); // In real app, never return password
  });

  it('should throw ApiError if email already exists when creating user', async () => {
    await expect(
      userService.createUser({
        email: 'test@example.com',
        password: 'anotherpassword',
        firstName: 'Duplicate',
        lastName: 'User',
        role: UserRole.USER,
      })
    ).rejects.toThrow(ApiError);
    await expect(
      userService.createUser({
        email: 'test@example.com',
        password: 'anotherpassword',
        firstName: 'Duplicate',
        lastName: 'User',
        role: UserRole.USER,
      })
    ).rejects.toHaveProperty('statusCode', 400);
  });

  it('should get a user by ID', async () => {
    const user = await userService.getUserById(testUser.id);
    expect(user).toBeDefined();
    expect(user?.email).toBe(testUser.email);
  });

  it('should return null if user by ID is not found', async () => {
    const user = await userService.getUserById('non-existent-id');
    expect(user).toBeNull();
  });

  it('should get a user by email', async () => {
    const user = await userService.getUserByEmail(testUser.email);
    expect(user).toBeDefined();
    expect(user?.id).toBe(testUser.id);
  });

  it('should return null if user by email is not found', async () => {
    const user = await userService.getUserByEmail('nonexistent@example.com');
    expect(user).toBeNull();
  });

  it('should get all users', async () => {
    const users = await userService.getAllUsers();
    expect(users).toBeInstanceOf(Array);
    expect(users.length).toBeGreaterThan(0);
  });

  it('should update a user', async () => {
    const updatedUser = await userService.updateUser(testUser.id, { firstName: 'Updated' });
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.firstName).toBe('Updated');
  });

  it('should throw ApiError if user to update is not found', async () => {
    await expect(userService.updateUser('non-existent-id', { firstName: 'Updated' })).rejects.toThrow(ApiError);
    await expect(userService.updateUser('non-existent-id', { firstName: 'Updated' })).rejects.toHaveProperty('statusCode', 404);
  });

  it('should delete a user', async () => {
    await userService.deleteUser(testUser.id);
    const deletedUser = await userService.getUserById(testUser.id);
    expect(deletedUser).toBeNull();
  });

  it('should throw ApiError if user to delete is not found', async () => {
    await expect(userService.deleteUser('non-existent-id')).rejects.toThrow(ApiError);
    await expect(userService.deleteUser('non-existent-id')).rejects.toHaveProperty('statusCode', 404);
  });
});
```