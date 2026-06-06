```javascript
const bcrypt = require('bcryptjs');
const httpStatus = require('http-status');
const prisma = require('../../src/database/prisma');
const userService = require('../../src/modules/users/user.service');
const ApiError = require('../../src/utils/ApiError');

// Clean up database after each test
const cleanUpDb = async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
};

beforeEach(async () => {
  await cleanUpDb();
});

afterAll(async () => {
  await cleanUpDb();
  await prisma.$disconnect();
});

describe('User Service - Integration Tests', () => {
  describe('createUser', () => {
    it('should successfully create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'USER',
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.password).toBeUndefined(); // Password should be omitted from service response

      // Verify password was hashed in the database
      const userInDb = await prisma.user.findUnique({ where: { id: user.id } });
      expect(userInDb).toBeDefined();
      expect(await bcrypt.compare(userData.password, userInDb.password)).toBe(true);
    });

    it('should throw ApiError (400) if email is already taken', async () => {
      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'Password123!',
        role: 'USER',
      };
      await userService.createUser(userData); // Create first user

      await expect(userService.createUser(userData)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
      );
    });
  });

  describe('queryUsers', () => {
    it('should return all users with default pagination and sorting', async () => {
      const user1 = await userService.createUser({ name: 'Alice', email: 'alice@example.com', password: 'Password123!', role: 'USER' });
      const user2 = await userService.createUser({ name: 'Bob', email: 'bob@example.com', password: 'Password123!', role: 'ADMIN' });

      const result = await userService.queryUsers({}, {});

      expect(result.results).toHaveLength(2);
      expect(result.totalResults).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.results.map((u) => u.email)).toEqual(expect.arrayContaining([user1.email, user2.email]));
    });

    it('should filter users by name', async () => {
      await userService.createUser({ name: 'Alice Smith', email: 'alice@example.com', password: 'Password123!', role: 'USER' });
      await userService.createUser({ name: 'Bob Johnson', email: 'bob@example.com', password: 'Password123!', role: 'USER' });

      const result = await userService.queryUsers({ name: 'Alice' }, {});
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Alice Smith');
    });

    it('should filter users by role', async () => {
      await userService.createUser({ name: 'Alice', email: 'alice@example.com', password: 'Password123!', role: 'USER' });
      await userService.createUser({ name: 'Bob', email: 'bob@example.com', password: 'Password123!', role: 'ADMIN' });

      const result = await userService.queryUsers({ role: 'ADMIN' }, {});
      expect(result.results).toHaveLength(1);
      expect(result.results[0].email).toBe('bob@example.com');
    });

    it('should apply pagination correctly', async () => {
      for (let i = 0; i < 15; i++) {
        await userService.createUser({ name: `User${i}`, email: `user${i}@example.com`, password: 'Password123!', role: 'USER' });
      }

      const resultPage1 = await userService.queryUsers({}, { page: 1, limit: 10 });
      expect(resultPage1.results).toHaveLength(10);
      expect(resultPage1.totalResults).toBe(15);
      expect(resultPage1.totalPages).toBe(2);

      const resultPage2 = await userService.queryUsers({}, { page: 2, limit: 10 });
      expect(resultPage2.results).toHaveLength(5);
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const user = await userService.createUser({ name: 'Test User', email: 'getbyid@example.com', password: 'Password123!', role: 'USER' });
      const fetchedUser = await userService.getUserById(user.id);

      expect(fetchedUser).toBeDefined();
      expect(fetchedUser.id).toBe(user.id);
      expect(fetchedUser.email).toBe(user.email);
    });

    it('should return null if user not found', async () => {
      const fetchedUser = await userService.getUserById('non-existent-id');
      expect(fetchedUser).toBeNull();
    });
  });

  describe('updateUserById', () => {
    it('should update user name and email', async () => {
      const user = await userService.createUser({ name: 'Old Name', email: 'old@example.com', password: 'Password123!', role: 'USER' });
      const updateBody = { name: 'New Name', email: 'new@example.com' };
      const updatedUser = await userService.updateUserById(user.id, updateBody);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.name).toBe('New Name');
      expect(updatedUser.email).toBe('new@example.com');

      const userInDb = await prisma.user.findUnique({ where: { id: user.id } });
      expect(userInDb.name).toBe('New Name');
      expect(userInDb.email).toBe('new@example.com');
    });

    it('should update user password', async () => {
      const user = await userService.createUser({ name: 'Test User', email: 'password@example.com', password: 'OldPassword123!', role: 'USER' });
      const updateBody = { password: 'NewPassword456!' };
      const updatedUser = await userService.updateUserById(user.id, updateBody);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.password).toBeUndefined(); // Password still omitted from response

      const userInDb = await prisma.user.findUnique({ where: { id: user.id } });
      expect(await bcrypt.compare('NewPassword456!', userInDb.password)).toBe(true);
    });

    it('should throw ApiError (404) if user not found', async () => {
      await expect(userService.updateUserById('non-existent-id', { name: 'New Name' })).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found')
      );
    });

    it('should throw ApiError (400) if new email is already taken by another user', async () => {
      const user1 = await userService.createUser({ name: 'User 1', email: 'user1@example.com', password: 'Password123!', role: 'USER' });
      await userService.createUser({ name: 'User 2', email: 'user2@example.com', password: 'Password123!', role: 'USER' });

      await expect(userService.updateUserById(user1.id, { email: 'user2@example.com' })).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
      );
    });
  });

  describe('deleteUserById', () => {
    it('should delete a user by ID', async () => {
      const user = await userService.createUser({ name: 'To Delete', email: 'delete@example.com', password: 'Password123!', role: 'USER' });
      await userService.deleteUserById(user.id);

      const fetchedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(fetchedUser).toBeNull();
    });

    it('should throw ApiError (404) if user not found', async () => {
      await expect(userService.deleteUserById('non-existent-id')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found')
      );
    });
  });
});
```