```javascript
const userService = require('../../src/services/userService');
const { db } = require('../../src/db/connection'); // Use main db for unit tests, or mock it

// Mock the knex instance for isolated unit testing
jest.mock('../../src/db/connection', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
  },
}));

describe('UserService Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    for (const method of Object.keys(db)) {
      if (typeof db[method] === 'function') {
        db[method].mockClear();
      }
    }
    db.first.mockClear();
    db.returning.mockClear();
  });

  it('should create a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer'
    };
    const createdUser = { id: 'uuid-1', ...userData, password: 'hashedpassword' };

    db.insert.mockReturnThis();
    db.returning.mockResolvedValue([createdUser]);

    const result = await userService.createUser(userData);
    expect(result).toEqual(createdUser);
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
      email: userData.email,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role,
    }));
  });

  it('should find a user by email', async () => {
    const mockUser = { id: 'uuid-1', email: 'test@example.com', password: 'hashedpassword', role: 'customer' };

    db.where.mockReturnThis();
    db.first.mockResolvedValue(mockUser);

    const result = await userService.findUserByEmail('test@example.com');
    expect(result).toEqual(mockUser);
    expect(db.where).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(db.first).toHaveBeenCalled();
  });

  it('should find a user by ID', async () => {
    const mockUser = { id: 'uuid-1', email: 'test@example.com', password: 'hashedpassword', role: 'customer' };

    db.where.mockReturnThis();
    db.first.mockResolvedValue(mockUser);

    const result = await userService.findUserById('uuid-1');
    expect(result).toEqual(mockUser);
    expect(db.where).toHaveBeenCalledWith({ id: 'uuid-1' });
    expect(db.first).toHaveBeenCalled();
  });

  it('should update a user', async () => {
    const userId = 'uuid-1';
    const updateData = { first_name: 'UpdatedName' };
    const updatedUser = { id: userId, email: 'test@example.com', first_name: 'UpdatedName' };

    db.where.mockReturnThis();
    db.update.mockReturnThis();
    db.returning.mockResolvedValue([updatedUser]);

    const result = await userService.updateUser(userId, updateData);
    expect(result).toEqual(updatedUser);
    expect(db.where).toHaveBeenCalledWith({ id: userId });
    expect(db.update).toHaveBeenCalledWith(updateData);
  });

  it('should delete a user', async () => {
    const userId = 'uuid-1';

    db.where.mockReturnThis();
    db.del.mockResolvedValue(1); // 1 row deleted

    const result = await userService.deleteUser(userId);
    expect(result).toBe(true);
    expect(db.where).toHaveBeenCalledWith({ id: userId });
    expect(db.del).toHaveBeenCalled();
  });

  it('should return null if user not found for findUserById', async () => {
    db.where.mockReturnThis();
    db.first.mockResolvedValue(null);

    const result = await userService.findUserById('non-existent-id');
    expect(result).toBeNull();
  });
});
```