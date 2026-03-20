import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/User';
import { getDbDataSource } from '../config/database';
import { NotFoundError, BadRequestError } from '../types/errors';
import logger from '../utils/logger';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = getDbDataSource().getRepository(User);
  }

  /**
   * Finds a user by ID.
   * @param id - The user ID.
   * @returns The user object or null if not found.
   */
  async findUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'isEmailVerified', 'role', 'createdAt', 'updatedAt'], // Exclude password
    });
    return user;
  }

  /**
   * Finds a user by email. Includes password for authentication purposes.
   * @param email - The user email.
   * @param includePassword - Whether to include the password hash in the returned user object.
   * @returns The user object or null if not found.
   */
  async findUserByEmail(email: string, includePassword = false): Promise<User | null> {
    const queryBuilder = this.userRepository.createQueryBuilder('user').where('user.email = :email', { email });

    if (includePassword) {
      queryBuilder.addSelect('user.password');
    }

    const user = await queryBuilder.getOne();
    return user;
  }

  /**
   * Creates a new user.
   * @param email - The user's email.
   * @param password - The user's plain text password.
   * @param role - The user's role (optional, defaults to UserRole.USER).
   * @returns The created user object (without password).
   * @throws BadRequestError if email already exists.
   */
  async createUser(email: string, password: string, role: UserRole = UserRole.USER): Promise<User> {
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new BadRequestError('User with this email already exists.');
    }

    const user = new User();
    user.email = email;
    user.password = await user.hashPassword(password); // Hash password
    user.role = role;
    user.isEmailVerified = false; // By default, email is not verified

    const newUser = await this.userRepository.save(user);
    logger.info(`User created: ${newUser.email}`);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  }

  /**
   * Updates a user's profile.
   * @param id - The user ID.
   * @param updates - An object with fields to update (e.g., email, role). Password update should be separate.
   * @returns The updated user object (without password).
   * @throws NotFoundError if user not found.
   */
  async updateUser(id: string, updates: Partial<Omit<User, 'password' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    // Prevent direct password update here, use a dedicated reset/change password flow
    if ('password' in updates) {
      logger.warn(`Attempted to update password via general updateUser for user ID: ${id}`);
      delete updates.password; // Strip password from updates if present
    }

    Object.assign(user, updates);
    const updatedUser = await this.userRepository.save(user);
    logger.info(`User updated: ${updatedUser.email}`);

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  /**
   * Deletes a user.
   * @param id - The user ID.
   * @returns True if deletion was successful.
   * @throws NotFoundError if user not found.
   */
  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundError('User not found.');
    }
    logger.info(`User deleted: ${id}`);
    return true;
  }

  /**
   * Updates a user's password.
   * @param id - The user ID.
   * @param newPassword - The new plain text password.
   * @returns The updated user object (without password).
   * @throws NotFoundError if user not found.
   */
  async updateUserPassword(id: string, newPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    user.password = await user.hashPassword(newPassword);
    const updatedUser = await this.userRepository.save(user);
    logger.info(`User password updated for: ${updatedUser.email}`);

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }
}